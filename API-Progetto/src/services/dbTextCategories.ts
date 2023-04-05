import { GetCommand, GetCommandInput, ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput} from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { Text, state } from "src/types/Text";
import { TextInfo } from "src/types/TextInfo";
import { isOriginalText, OriginalText } from "src/types/OriginalText";
import { isTranslation, Translation } from "src/types/Translation";
import { Tenant, Category } from "src/types/Tenant";
import { ddbDocClient } from "./dbConnection";

//---------------------
//INTERFACE to read more easly the output of utilgetTenantLangCat
//---------------------
interface LangCat{
    language: string;
    categories: Array<Category>;
}

//---------------------
//UTIL functions that will be used across all db functions 
//to make the code more simple and compact
//---------------------
const utilMergeMeta = (text: Text, info: TextInfo[], language: string, categories: Category[]) => {
    //custum util function to help merge the text with it's metadata and compile OriginalText or Translation
    //input: Text, TextInfo[], originallanguage, Category[]
    //output: OriginalText / Translation / Error
    try {
        let lang = text.languageIdtextId.split("#")[0];
        let id = text.languageIdtextId.split("#")[1];
        //seach the meta by textId
        let meta = info.find(element => element.categoryIdtextId.split("#")[1] === id);
        //construct the object merging records from the two tables
        //separate ori/trans based on wherever the language is the original one
        if (lang === language) {
            return ({
                ID: id,
                language: lang,
                //get the name based on the categoryId
                category: categories.find(element => element.id === meta.categoryIdtextId.split("#")[0]).name,
                comment: meta.comment,
                link: meta.link,
            } as OriginalText)
        }
        else {
            return ({
                ID: id,
                language: lang,
                //get the name based on the categoryId
                category: categories.find(element => element.id === meta.categoryIdtextId.split("#")[0]).name,
                state: text.stato,
                feedback: text.feedback,
            } as Translation);
        }
    }
    catch (err) {
        throw { err };
    }
}

const utilgetTenantLangCat = async (tenant: string) => {
    //util function to retrieve orignal language and all categories inside a Tenant
    //input: tenant
    //output: LangCat / Error
    return await(await ddbDocClient.send(new GetCommand({
        TableName: environment.dynamo.TextInfoTable.tableName,
        Key: { id: tenant },
        ProjectionExpression: "defaultLanguage, categories",
    } as GetCommandInput))).Item as LangCat;
}

//---------------------
//DB functions that will be called by the LAMBDA API calls
//---------------------
const dbgetAllTexts = async (tenant: string) => {
    //SCAN and return all Texts from one Tenant
    //input: tenant
    //output: { a:{OriginalText[]}, b:{Translation[]}}  } / Error
    try {
        //get language and categories of the tenant
        const TenantInfo: LangCat = await(utilgetTenantLangCat(tenant));
        if (TenantInfo == null)
            throw {"error":"error"};

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextInfoTable.tableName,
            FilterExpression: "idTenant = :t",
            ExpressionAttributeValues: { ":t": tenant },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextTable.tableName,
            FilterExpression: "idTenant = :t",
            ExpressionAttributeValues: { ":t": tenant },
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextInfo[];
        //------------------NOTE----!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as Text[];
        if (info == null || txt == null)
            return { "error": "error reading texts from db" };

        //merge the data inside a collection of OriginalText or Translation objects
        var ori=[];
        var tran=[];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let data = utilMergeMeta(text, info, TenantInfo.language, TenantInfo.categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            if (isOriginalText(data))
                ori.push(data as OriginalText);
            else if (isTranslation(data))
                tran.push(data as Translation);
            else
                throw (data);
        });
        //return all the data
        return {a: ori, b: tran};
    } catch (err) {
        throw { err };
    }
};

const dbgetByCategory = async (tenant: string, category: string) => {
    //SCAN and return all Texts from a Category of one Tenant
    //input: tenant, name
    //output: { a:{OriginalText[]}, b:{Translation[]}}  } / Error
    try {
        //get language and categories of the tenant
        let TenantInfo = await(utilgetTenantLangCat(tenant));
        if (TenantInfo == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextInfoTable.tableName,
            FilterExpression: "idTenant = :t and begin_with(categoryIdtextId, :c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": category+"#",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextTable.tableName,
            FilterExpression: "idTenant = :t",
            ExpressionAttributeValues: { ":t": tenant },
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextInfo[];
        //------------------NOTE!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as Text[];
        if (info == null || txt == null)
            return { "error": "error reading texts from db" };

        //merge the data inside a collection of OriginalText or Translation objects
        var ori = [];
        var tran = [];
        //iterate over every row of Text table
        txt.forEach(function (text) {
            //if this text id is not the info table then skip
            if (!info.find(element => element.categoryIdtextId.split("#")[1] === "#" + text.languageIdtextId.split("#"[1])))
                return;
            let data = utilMergeMeta(text, info, TenantInfo.language, TenantInfo.categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            if (isOriginalText(data))
                ori.push(data as OriginalText);
            else if (isTranslation(data))
                tran.push(data as Translation);
            else
                throw (data);
        });
        //return all the data
        return { a: ori, b: tran };
    } catch (err) {
        throw { err };
    }
};

const dbgetByLanguage = async (tenant: string, language: string, state: state) => {
    //SCAN and return all Texts from a Language of one Tenant
    //input: tenant, language, state
    //output: { a:{OriginalText[]}, b:{Translation[]}}  } / Error
    try {
        //get language and categories of the tenant
        let TenantInfo = await (utilgetTenantLangCat(tenant));
        if (TenantInfo == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextInfoTable.tableName,
            FilterExpression: "idTenant = :t",
            ExpressionAttributeValues: {
                ":t": tenant,
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextTable.tableName,
            FilterExpression: "idTenant= :t and state= :s and begins_with(languageIdtextId,:l)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": language + "#",
                ":s": state,
            },
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextInfo[];
        //------------------NOTE!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as Text[];
        if (info == null || txt == null)
            return { "error": "error reading texts from db" };

        //merge the data inside a collection of OriginalText or Translation objects
        var ori = [];
        var tran = [];
        //iterate over every row of Text table
        txt.forEach(function (text) {
            //if this text id is not the info table then skip
            if (!info.find(element => element.categoryIdtextId.split("#")[1] === "#" + text.languageIdtextId.split("#"[1])))
                return;
            let data = utilMergeMeta(text, info, TenantInfo.language, TenantInfo.categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            if (isOriginalText(data))
                ori.push(data as OriginalText);
            else if (isTranslation(data))
                tran.push(data as Translation);
            else
                throw (data);
        });
        //return all the data
        return { a: ori, b: tran };

    } catch (err) {
        throw { err };
    }
};

const dbgetTexts = async (tenant: string, language: string, category: string) => {
    //SCAN and return all Texts from a Category within a language of one Tenant
    //input: tenant, language, category
    //output: OriginalText / Translation / Error
    //get language and categories of the tenant
    try {
        let TenantInfo = await (utilgetTenantLangCat(tenant));
        if (TenantInfo == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextInfoTable.tableName,
            FilterExpression: "idTenant = :t and begins_with(categoryIdtextId,:c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": category+"#",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextTable.tableName,
            FilterExpression: "idTenant= :t and begins_with(languageIdtextId,:l)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": language + "#",
            },
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextInfo[];
        //------------------NOTE!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as Text[];
        if (info == null || txt == null)
            return { "error": "error reading texts from db" };

        //merge the data inside a collection of OriginalText or Translation objects
        var ori = [];
        var tran = [];
        //iterate over every row of Text table
        txt.forEach(function (text) {
            //if this text id is not the info table then skip
            if (!info.find(element => element.categoryIdtextId.split("#")[1] === "#" + text.languageIdtextId.split("#"[1])))
                return;
            let data = utilMergeMeta(text, info, TenantInfo.language, TenantInfo.categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            if (isOriginalText(data))
                ori.push(data as OriginalText);
            else if (isTranslation(data))
                tran.push(data as Translation);
            else
                throw (data);
        });
        //return all the data
        return { a: ori, b: tran };
    }
    catch (err) {
        throw { err };
    }
};

const dbdeleteText = async (tenant: string, text: string) => {
    //DELETE a specific TextId. This will cause the deletion of the text in every language.
    //input: tenant, text
    //output: true / Error
    const params: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "contains(languageidCategorytextId, :c)",
        ExpressionAttributeValues: {
            ":c": "#"+text,
        },
    };
    try {
        return await ddbDocClient.send(new DeleteCommand(params));
    } catch (err) {
        throw { err };
    }
};

const dbpostOriginalText = async (tenant: string, languagecategoryid: string, text: string, comment: string, link: string) => {
    //PUT new item into TextCategory as text in native language inside a Tenant
    //input: tenant, languageidCategorytextId, text, comment, link
    //output: true / Error

    //STEPS:
    //1        PUT text in native language
    //2        GET all languages from tenant
    //3        PUT try iterate to write all transaltions
    //3.1 FAIL ??? DELETE of all translations just added ???

    // --1--
    //write te text in native language
    const params: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Item: {
            idTenant: tenant,
            languageidCategorytextId: languagecategoryid,
            isDefault: true,
            Text: {
                text: text,
                state: 'testoOriginale',
                comment: comment,
                link: link,
            },
        },
    };
    try {
        let tmp = await ddbDocClient.send(new PutCommand(params));

        // --2--
        //if success get all languages to translate to from Tenant
        if (tmp) {
            let param: GetCommandInput = {
                TableName: environment.dynamo.TenantTable.tableName,
                Key: {
                    id: tenant,
                },
                ProjectionExpression: "languages",
            }
            let languages = ddbDocClient.send(new GetCommand(param));
            if (languages == null)
                throw ({ "error": "error" });

            // --3--
            //write all empty translations iterating on languages
            (await languages).Item.forEach(function (lang: string) {
                dbpostTranslation(tenant, lang + "#" + languagecategoryid.split("#")[1] + "#" + languagecategoryid.split("#")[2], "");
            });
        }
        else
            throw ({ "error": "error" });
    } catch (err) {
        throw { err };
    }
};

const dbpostTranslation = async (tenant: string, languagecategoryid: string, newtext: string) => {
    //PUT new item into TextCategory as translation of one language inside a Tenant
    //input: tenant, languageidCategorytextId, text
    //output: true / Eror
    const params: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Item: {
            idTenant: tenant,
            languageidCategorytextId: languagecategoryid,
            isDefault: false,
            Text: {
                text: newtext,
                state: 'daTradurre',
            },
        },
    };
    try {
        return await ddbDocClient.send(new PutCommand(params));
    } catch (err) {
        throw { err };
    }
};

const dbputCategory = async (tenant: string, category: string, name: string) => {
    //UPDATE the name of a category inside a Tenant
    //input: tenant, category, name
    //output: true / Errror

    //STEPS:
    //1        SCAN GET all items of one category
    //2        update all items with new name category
    //3        PUT try iterate all updated items in db
    //3.1 FAIL DELETE of all new items just added
    //4        DELETE all old items with old name

    //BATCH non è usabile perchè richiede di definire i nomi delle tabelle e delle chiavi per intero scritti e non passati con filtri.
    //TRANSACTIONS non è usabile perchè è piu lento di batch e ogni operazione costa il doppio di una non transazione $$$$$


    // --1--
    //Scan all texts inside the caategory seacrhed
    let data  = await dbgetByCategory(tenant, category);
    if (data == null)
        return { "error": "something something" };

    // --2--
    //Manually modify the name of the category of all results 
    data.forEach(function (Category) {
        let tmp= Category.languageidCategorytextId.split("#");
        Category.languageidCategorytextId = tmp[0] + "#" + name + "#" + tmp[2];
    });

    // --3--
    //Try to write back all the new texts inside the new category
    data.forEach(function (item) {
        let param: PutCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Item: {
                idTenant: item.idTenant,
                languageidCategorytextId: item.languageidCategorytextId,
                isDefault: item.isDefault,
                Text: item.txt,
            },
        };
        // --3.1--  FAIL
        //If any of the put fails then stop the whole process, 
        //delete any data already written and then return error
        let res = ddbDocClient.send(new PutCommand(param));
        if (res)
            {
            let param: DeleteCommandInput = {
                TableName: environment.dynamo.TextCategoryTable.tableName,
                Key: {
                    idTenant: tenant,
                },
                ConditionExpression: "contains(languageidCategorytextId, :c)",
                ExpressionAttributeValues: {
                    ":c": "#" + name + "#",
                },
            };
            ddbDocClient.send(new DeleteCommand(param));
            throw ({"error":"failed to update all texts"});
        }

        // --4--
        //Delete all texts with old category name
        let params: DeleteCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
            },
            ConditionExpression: "contains(languageidCategorytextId, :c)",
            ExpressionAttributeValues: {
                ":c": "#" + category + "#",
            },
        };
        return ddbDocClient.send(new DeleteCommand(params));
    });
};

const dbputTranslationStateCategoryTextBased = async (tenant: string, categorytextid: string, state: state) => {
    //SUPPORT FUNCTION FOR dbputOriginalText
    //UPDATE the state of all translations to daTradurre after a text in native language has been changed
    //input: tenant, CategorytextId, state
    //output: true / Error
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            isDefault: true,
        },
        ConditionExpression: "contains(languageidCategorytextId, :c)",
        UpdateExpression: "set Text.state = {:s}",
        ExpressionAttributeValues: {
            ":s": state,
            ":c": categorytextid,
        },
    };
    try {
        return await ddbDocClient.send(new UpdateCommand(params));
    } catch (err) {
        throw { err };
    }
};

const dbputOriginalText = async (tenant: string, languagecategoryid: string, text: Text, change) => {
    //UPDATE the informations (text, comment and link) of a text  in native language inside a Tenant
    //change => if(true) UPDATE of the state of all its translations to 'daTradurre'
    //input: tenant, languageidategorytextId, Text (text, state testoOriginale, feedback null, comment, link), change
    //output: true / Error

    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            languageidCategorytextId: languagecategoryid,
            isDefault: true,
        },
        UpdateExpression: "set Text = {:t}",
        ExpressionAttributeValues: {
            ":t": text,
        },
    };
    try {
        await ddbDocClient.send(new UpdateCommand(params));
        if (change) {
            let categorytextid = "#" + languagecategoryid.split("#")[1] + "#" + languagecategoryid.split("#")[2];
            return await dbputTranslationStateCategoryTextBased(tenant, categorytextid, text.stato);
        }
        return true;
    } catch (err) {
        throw { err };
    }
};

const dbputTranslation = async (tenant: string, languagecategoryid: string, text: Text) => {
    //UPDATE the data (text, state, comment, link, feedback) of a translation inside a Tenant
    //input: tenant, languageidCategorytextId, Text (text, state, feedback null, comment, link)
    //output: true / Error
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            languageidCategorytextId: languagecategoryid,
            isDefault: false,
        },
        UpdateExpression: "set Text = {:t}",
        ExpressionAttributeValues: {
            ":t": text,
        },
    };
    try {
        return await ddbDocClient.send(new UpdateCommand(params));
    } catch (err) {
        throw { err };
    }
};

export {dbgetAllTexts, dbgetByCategory, dbgetByLanguage, dbgetTexts, dbdeleteText, dbpostOriginalText, dbpostTranslation, dbputCategory, dbputOriginalText, dbputTranslation };