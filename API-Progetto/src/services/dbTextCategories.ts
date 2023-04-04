import { GetCommand, GetCommandInput, ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput, GetCommandInput} from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { TextCategory } from "src/types/TextCategory";
import { state, Text } from "src/types/Text";
import { ddbDocClient } from "./dbConnection";

const dbgetAllTexts = async (tenant: string) => {
    //SCAN and return all TextCategories of one Tenant
    //input: tenant
    //output: TextCategory[] / Error
    const params: ScanCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        FilterExpression: "idTenant = :t",
        ExpressionAttributeValues: { ":t": tenant },
    };
    try {
        const category = await ddbDocClient.send(new ScanCommand(params));
        return category.Items as TextCategory[];
    } catch (err) {
        throw { err };
    }
};

const dbgetByCategory = async (tenant: string, category: string) => {
    //SCAN and return all Texts from a Category of one Tenant
    //input: tenant, name
    //output: TextCategory[] / Error
    const params: ScanCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        FilterExpression: "idTenant = :t and contains(languageidCategorytextId, :c)",
        ExpressionAttributeValues: {
            ":t": tenant,
            ":c": "#"+category+"#",
        },
    };
    try {
        const category = await ddbDocClient.send(new ScanCommand(params));
        return category.Items as TextCategory[];
    } catch (err) {
        throw { err };
    }
};

const dbgetByLanguage = async (tenant: string, language: string, state: state) => {
    //SCAN and return all Texts from a Language of one Tenant
    //input: tenant, language, state
    //output: TextCategory[] / Error
    const params: ScanCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        FilterExpression: "idTenant= :t and state= :s and begins_with(languageidCategorytextId,:l)",
        ExpressionAttributeValues: {
            ":t": tenant,
            ":l": language + "#",
            ":s": state,
        },
    };
    try {
        const category = await ddbDocClient.send(new ScanCommand(params));
        return category.Items as TextCategory[];
    } catch (err) {
        throw { err };
    }
};

const dbgetTexts = async (tenant: string, language: string, category: string) => {
    //SCAN and return all Texts from a Category within a language of one Tenant
    //input: tenant, language, category
    //output: Text[] / Error
    const params: ScanCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        FilterExpression: "idTenant= :t and begins_with(languageidCategorytextId, :lc)",
        ExpressionAttributeValues: {
            ":t": tenant,
            ":lc": category + "#" + language + "#",
        },
        ProjectionExpression: "Text",
    };
    try {
        const texts = await ddbDocClient.send(new ScanCommand(params));
        return texts.Items as Text[];
    } catch (err) {
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