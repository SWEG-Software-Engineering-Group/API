import { ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput} from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { Text, state } from "src/types/Text";
import { TextInfo } from "src/types/TextInfo";
import { isOriginalText, OriginalText } from "src/types/OriginalText";
import { isTranslation, Translation } from "src/types/Translation";
import { Tenant, Category } from "src/types/Tenant";
import { ddbDocClient } from "./dbConnection";
import { dbgetTenant } from "./dbTenant";


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

//---------------------
//DB functions that will be called by the LAMBDA API calls
//---------------------

//__________GET__________
const dbgetAllTexts = async (tenant: string) => {
    //SCAN and return all Texts from one Tenant
    //input: tenant
    //output: { a:{OriginalText[]}, b:{Translation[]}}  } / Error
    try {
        //get language and categories of the tenant
        const TenantInfo: Tenant = await(dbgetTenant(tenant));
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
            let data = utilMergeMeta(text, info, TenantInfo.defaultLanguage, TenantInfo.categories);
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
        let TenantInfo: Tenant = await (dbgetTenant(tenant));
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
            let data = utilMergeMeta(text, info, TenantInfo.defaultLanguage, TenantInfo.categories);
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
        let TenantInfo: Tenant = await (dbgetTenant(tenant));
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
            let data = utilMergeMeta(text, info, TenantInfo.defaultLanguage, TenantInfo.categories);
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
        let TenantInfo: Tenant = await (dbgetTenant(tenant));
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
            let data = utilMergeMeta(text, info, TenantInfo.defaultLanguage, TenantInfo.categories);
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


//__________DELETE__________
const dbdeleteText = async (tenant: string, text: string) => {
    //DELETE a specific TextId. This will cause the deletion of the text in every language.
    //input: tenant, text
    //output: true / Error

    //for the chance of errors first it performs the delete of all texts, then it deletes all the metadata.
    //it is acceptable but nnot ideal that there is some metadata leftover without an actual text in any language.
    //it is not acceptable to have any texts leftover without its metadata counterpart.
    const param1: DeleteCommandInput = {
        TableName: environment.dynamo.TextTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "contains(languageIdtextId, :t)",
        ExpressionAttributeValues: {
            ":t": "#"+text,
        },
    };
    const param2: DeleteCommandInput = {
        TableName: environment.dynamo.TextInfoTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "contains(categoryIdtextId, :t)",
        ExpressionAttributeValues: {
            ":t": "#" + text,
        },
    };
    try {
        await ddbDocClient.send(new DeleteCommand(param1));
        return await ddbDocClient.send(new DeleteCommand(param2));
    } catch (err) {
        throw { err };
    }
};

//__________PUT__________
const dbpostOriginalText = async (tenant: string, ID: string, category: string, text: string, comment: string, link: string) => {
    //PUT new Text in original language with its metadata inside a Tenant
    //input: tenant, category, text, comment, link
    //output: true / Error

    //generate first the metadata and then the text.
    let TenantInfo: Tenant = await (dbgetTenant(tenant));
    if (TenantInfo == null)
        throw { "error": "error" };

    const paramsInfo: PutCommandInput = {
        TableName: environment.dynamo.TextInfoTable.tableName,
        Item: {
            idTenant: tenant,
            categoryIdtextId: category+"#"+ID,
            comment: comment,
            link: link,
        },
    };
    const paramsText: PutCommandInput = {
        TableName: environment.dynamo.TextTable.tableName,
        Item: {
            idTenant: tenant,
            languageIdtextId: TenantInfo.defaultLanguage + "#" + ID,
            text: text,
            stato: 'testoOriginale',
            feedback: null,
        },
    };
    try {
        //this depends on what the PutCommand returns.
        let tmp = await ddbDocClient.send(new PutCommand(paramsInfo));
        if (tmp) {
            return await ddbDocClient.send(new PutCommand(paramsText));
        }
        else
            throw ({ "error": "error" });
    } catch (err) {
        throw { err };
    }
};

const dbpostTranslation = async (tenant: string, language: string, ID: string, text: string) => {
    //PUT new Translation of one language inside a Tenant
    //input: tenant, language, ID, text
    //output: true / Eror

    try {
        const params: PutCommandInput = {
            TableName: environment.dynamo.TextTable.tableName,
            Item: {
                idTenant: tenant,
                languageIdtextId: language + "#" + ID,
                text: text,
                state: 'daTradurre',
                feedback: null,
            },
        };
        return await ddbDocClient.send(new PutCommand(params));
    } catch (err) {
        throw { err };
    }
};

//__________UPDATE__________
const dbputCategory = async (tenant: string, category: string, name: string) => {
    //UPDATE the name of a category inside a Tenant
    //input: tenant, category, name
    //output: true / Errror

    try {
        let TenantInfo: Tenant = await (dbgetTenant(tenant));
        if (TenantInfo == null)
            throw { "error": "error" };

        let index = TenantInfo.categories.findIndex(element => element.id === category);
        if (index==-1)
            throw { "error": "error" };
        TenantInfo.categories[index].name = name;

        const params: UpdateCommandInput = {
            TableName: environment.dynamo.TenantTable.tableName,
            Key: {
                idTenant: tenant,
            },
            UpdateExpression: "set categories = {:c}",
            ExpressionAttributeValues: {
                ":c": TenantInfo.categories,
            },
        };
        return await (ddbDocClient.send(new UpdateCommand(params)));
    } catch (err) {
        throw { err };
    }

};

const dbputOriginalText = async (tenant: string, ID: string, category: string, text: string, comment: string, link: string) => {
    //do I have to consider the change of the category?

    //UPDATE the informations (text, comment and link) of a text  in native language inside a Tenant
    //change => if(true) UPDATE of the state of all its translations to 'daTradurre'
    //input: tenant, ID, text, comment, link, change
    //output: true / Error
    try {
        let TenantInfo: Tenant = await (dbgetTenant(tenant));
        if (TenantInfo == null)
            throw { "error": "error" };

        const paramstext: UpdateCommandInput = {
            TableName: environment.dynamo.TextTable.tableName,
            Key: {
                idTenant: tenant,
                langugeIdtextId: TenantInfo.defaultLanguage + "#" + ID,
            },
            UpdateExpression: "set text = {:t}",
            ExpressionAttributeValues: {
                ":t": text,
            },
        };
        if (await ddbDocClient.send(new UpdateCommand(paramstext)))
            throw {"error":"error"};

        //let category = await (dbgetCategoryById(tenant, ID));
        //if (!category)
        //    throw { "error": "error" };

        const paramsinfo: UpdateCommandInput = {
            TableName: environment.dynamo.TextInfoTable.tableName,
            Key: {
                idTenant: tenant,
                categoryIdtextId: category + "#" + ID,
            },
            UpdateExpression: "set comment = {:c} and set link = {:l}",
            ExpressionAttributeValues: {
                ":c": comment,
                ":l": link,
            },
        };
        return await ddbDocClient.send(new UpdateCommand(paramsinfo));

    } catch (err) {
        throw { err };
    }
};

const dbputTranslation = async (tenant: string, language: string, id: string, text: Text, stato:state, feedback: string) => {
    //UPDATE the data (text, state, feedback) of a translation inside a Tenant
    //input: tenant, language, textId, Text, text, state, feedback.
    //output: true / Error

    try {
        const params: UpdateCommandInput = {
            TableName: environment.dynamo.TextTable.tableName,
            Key: {
                idTenant: tenant,
                languageidCategorytextId: language + "#" + id,
                isDefault: false,
            },
            UpdateExpression: "set text = {:t} and set state = {:s} and set feedback = {:f}",
            ExpressionAttributeValues: {
                ":t": text,
                ":s": stato,
                ":f": feedback,
            },
        };
        return await ddbDocClient.send(new UpdateCommand(params));
    } catch (err) {
        throw { err };
    }
};

export {dbgetAllTexts, dbgetByCategory, dbgetByLanguage, dbgetTexts, dbdeleteText, dbpostOriginalText, dbpostTranslation, dbputCategory, dbputOriginalText, dbputTranslation };