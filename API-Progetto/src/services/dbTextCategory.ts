import { BatchWriteCommand, BatchWriteCommandInput, ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from 'src/environment/environment';
import { Text } from "src/types/Text";
import { TextCategoryInfo } from "src/types/TextCategoryInfo";
import { TextCategory, state } from "src/types/TextCategory";
import { Tenant, Category } from "src/types/Tenant";
import { ddbDocClient } from "./dbConnection";
import { dbgetTenantinfo, dbgetCategories, dbgetDefaultLanguage } from "./dbTenant";



//NOTE: language_category_title is formatted: " <language&category\title> "
//using charactes <&\> that are escaped by the lambda to avoid conflict with user input
//lang      = language_category_title.split("&")[0].split("<")[1];
//category  = language_category_title.split("\\")[0].split("&")[1];
//title     = language_category_title.split(">")[0].split("\\")[1];
//split("&")[0].split("<")[1].split("\\")[0].split("&")[1]..split(">")[0].split("\\")[1];

//---------------------
//UTIL functions that will be used across all db functions 
//to make the code more simple and compact
//---------------------
const utilMergeMeta = (text: TextCategory, info: TextCategoryInfo[], categories: Category[]) => {
    //custum util function to help merge the text with it's metadata
    //input: text(TextCategory), info(TextCategoryInfo[]), categories(Category[])
    //output: Text / Error
    try {
        let lang = text.language_category_title.split("&")[0].split("<")[1];
        let category = text.language_category_title.split("\\")[0].split("&")[1];
        let title = text.language_category_title.split(">")[0].split("\\")[1];
        //seach the meta by textId
        let meta = info.find(element => element.language_category_title === text.language_category_title);
        //construct the object merging records from the two tables
        return ({
            idTenant: text.idTenant,
            language: lang,
            //get the name based on the categoryId
            category: categories.find(element => element.id === category),
            title: title,
            text: text.text,
            stato: text.stato,
            comment: meta.comment,
            link: meta.link,
            feedback: meta.feedback,
        } as Text);
    }
    catch (err) {
        throw { err };
    }
}

const utilChangeStateTranslations = async (tenant: string, defaultlanguage: string, category: string, title: string, state: state) => {
    //custum util function to help changin all the states of translations to 'daTradurre' or other when an original text is changed
    //input: tenant(String), defaultlanguage(String), category(String), title(String), state(state)
    //output: True / Error
    try {
        const params: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "idTenant = :t and contains(language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "#" + category + "#" + title + "#",
            },
        };
        const info = (await ddbDocClient.send(new ScanCommand(params))).Items as TextCategoryInfo[];

        //this part should make the calls in parallel and wait for the map array of promises
        //instead of waiting for the complition of every single item like in forEach loop
        await Promise.all(info.map(async (element) => {
            if (element.language_category_title.split("&")[0].split("<")[1] === defaultlanguage)
                return;
            const update: UpdateCommandInput = {
                TableName: environment.dynamo.TextCategoryTable.tableName,
                Key: {
                    idTenant: tenant,
                    language_category_title: element.language_category_title,
                },
                UpdateExpression: "set state = {:s}",
                ExpressionAttributeValues: {
                    ":s": state,
                },
            };
            await ddbDocClient.send(new UpdateCommand(update));
        }));

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
    //input: tenant(String)
    //output: Text[] / Error
    try {
        //get categories of the tenant
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            FilterExpression: "idTenant = :t",
            ExpressionAttributeValues: { ":t": tenant },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "idTenant = :t",
            ExpressionAttributeValues: { ":t": tenant },
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextCategoryInfo[];
        //------------------NOTE----!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as TextCategory[];
        if (info == null || txt == null)
            throw { "error": "error reading texts from db" };

        //merge the data together between texts and infos
        var result = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let data = utilMergeMeta(text, info, categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            result.push(data);
        });
        //return all the data
        return result;
    } catch (err) {
        throw { err };
    }
};

const dbgetByCategory = async (tenant: string, category: string) => {
    //SCAN and return all Texts from a Category of one Tenant
    //input: tenant(String), category(String)
    //output: Text[] / Error
    try {
        //get categories of the tenant
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            FilterExpression: "idTenant = :t and contains(language_category_title, :c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": "&" + category + "\\",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "idTenant = :t and contains(language_category_title, :c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": "&" + category + "\\",
            }
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextCategoryInfo[];
        //------------------NOTE!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as TextCategory[];
        if (info == null || txt == null)
            throw { "error": "error reading texts from db" };

        //merge the data together between texts and infos
        var result = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let data = utilMergeMeta(text, info, categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            result.push(data);
        });
        //return all the data
        return result;
    } catch (err) {
        throw { err };
    }
};

const dbgetByLanguage = async (tenant: string, language: string, state: state) => {
    //SCAN and return all Texts from a Language of one Tenant
    //input: tenant(String), language(String), state(State)
    //output: Text[] / Error
    try {
        //get categories of the tenant
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            FilterExpression: "idTenant = :t and begins_with(language_category_title, :l)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": "<" + language + "&",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "idTenant = :t and begis_with(language_category_title, :l) and state= :s",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": "<" + language + "&",
                ":s": state,
            }
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextCategoryInfo[];
        //------------------NOTE!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as TextCategory[];
        if (info == null || txt == null)
            throw { "error": "error reading texts from db" };

        //merge the data together between texts and infos
        var result = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let data = utilMergeMeta(text, info, categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            result.push(data);
        });
        //return all the data
        return result;
    } catch (err) {
        throw { err };
    }
};

const dbgetTexts = async (tenant: string, language: string, category: string) => {
    //SCAN and return all Texts from a Category within a language of one Tenant
    //input: tenant(String), language(String), category(String)
    //output: Text[] / Error
    try {
        //get categories of the tenant
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            FilterExpression: "idTenant = :t and begins_with(language_category_title,:lc)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":lc": "<" + language + "&" + category + "\\",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "idTenant= :t and begins_with(language_category_title,:lc)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":lc": "<" + language + "&" + category + "\\",
            },
        };
        const info = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextCategoryInfo[];
        //------------------NOTE!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param2))).Items as TextCategory[];
        if (info == null || txt == null)
            throw { "error": "error reading texts from db" };

        //merge the data together between texts and infos
        var result = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let data = utilMergeMeta(text, info, categories);
            if (data == null)
                throw { "error": "error mergind metadata" };
            result.push(data);
        });
        //return all the data
        return result;
    } catch (err) {
        throw { err };
    }
};

const dbgetTranslationsLanguages = async (tenant: string, category: string, title: string) => {
    //GET all the languages an original text is translated to.
    //input: tenant(String), category:(String), title(String)
    //output: String[] / Error

    try {
        //get categories of the tenant
        const deflang = await (dbgetDefaultLanguage(tenant));
        if (deflang == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "idTenant= :t and begins_with(language_category_title,:lc)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\" + title + ">",
            },
        };
        //------------------NOTE!!!!
        //this function gets all texts from a tenant. in case all the data goes over 1MB in size
        //the call could fail, throttle or take quite a lot of time.
        //this is a case that migth brake this function!
        const txt = await (await ddbDocClient.send(new ScanCommand(param))).Items as TextCategory[];
        if (txt == null)
            throw { "error": "error reading texts from db" };

        //merge the data together between texts and infos
        var result = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let language = text.language_category_title.split("&")[0].split("<")[1];
            if (language !== deflang)
                result.push(language);
        });
        //return all the data
        return result;
    } catch (err) {
        throw { err };
    }

}

const dbGetTexts = async (tenantID: string, language: string = null, category: string = null, id: string = null) => {
    var params: ScanCommandInput = { TableName: environment.dynamo.TextCategoryTable.tableName, };
    //caso lingua = null ritorna la lingua di default
    if (language == null) {
        language = await dbgetDefaultLanguage(tenantID);
    }
    params["Key"] = {
        idTenant: tenantID,
    }
    params["FilterExpression"] = "begins_with(#attributename, :begin)";
    params["ExpressionAttributeNames"] =
    {
        "#attributename": "language_category_title",
    };
    params["ExpressionAttributeValues"] =
    {
        ':begin': "<" + language + "&" + ((category == null) ? "" : (category + "\\" + (id == null) ? "" : (id + ">")))
    };
    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Success - GET", data);
        if (!data.Items) return [];
        return data.Items as Text[];
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
}

/*const dbgetCategories = async (tenantID: string) => {
    var params: ScanCommandInput = { TableName: environment.dynamo.TextCategoryTable.tableName, };
    params["Key"] = {
        idTenant: tenantID,
    }
    params["FilterExpression"] = "#isDefault = :isDefault";
    params["ExpressionAttributeNames"] =
    {
        "#isDefault": "isDefault",
    };
    params["ExpressionAttributeValues"] =
    {
        ':isDefault': true,
    };

    //ottieni solo i parametri;
    params["AttributesToGet"] = ['language_category_title'];

    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Success - GET", data);
        if (!data.Items) return [];

        //filtra qui gli oggetti rimuovendo i duplicati
        var text: TextCategory[] = data.Items as TextCategory[];
        var values: string[] = [];

        text.forEach((val) => {
            var current = val["language_category_title"].split("\\")[0].split("&")[1];
            if (values.includes(current)) {
                values.push(current);
            }
        });

        return values;

    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
}
*/

const textsOfState = async (tenantID: string, language: string, state: state) => {
    var params: ScanCommandInput = { TableName: environment.dynamo.TextCategoryTable.tableName, };
    params["Key"] = {
        idTenant: tenantID,
    }
    params["FilterExpression"] = "stato=:stato AND begins_with(#attributename, :begin)";
    params["ExpressionAttributeNames"] =
    {
        "#attributename": "language_category_title",
    };
    params["ExpressionAttributeValues"] =
    {
        ':begin': "<" + language + "&",
        ':stato': state
    };

    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Success - GET", data);
        if (!data.Items) return [];

        //filtra qui gli oggetti rimuovendo i duplicati
        var text: TextCategory[] = data.Items as TextCategory[];

        return text;

    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
}


//__________DELETE__________
const dbdeleteText = async (tenant: string, title: string) => {
    //DELETE a specific TextId. This will cause the deletion of the text in every language.
    //input: tenant(String), title(String)
    //output: true / Error

    //for the chance of errors first it performs the delete of all texts, then it deletes all the metadata.
    //it is acceptable but not ideal that there is some metadata leftover without an actual text in any language.
    //it is not acceptable to have any texts leftover without its metadata counterpart.
    const param1: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "contains(language_category_title, :t)",
        ExpressionAttributeValues: {
            ":t": "\\" + title + ">",
        },
    };
    const param2: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "contains(language_category_title, :t)",
        ExpressionAttributeValues: {
            ":t": "\\" + title + ">",
        },
    };
    try {
        await ddbDocClient.send(new DeleteCommand(param1));
        return await ddbDocClient.send(new DeleteCommand(param2));
    } catch (err) {
        throw { err };
    }
};

const dbdeleteLanguageTexts = async (tenant: string, language: string) => {
    //DELETE all texts translated into a language.
    //input: tenant(String), language(String)
    //output: true / Error

    const param1: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "begins_with(language_category_title, :l)",
        ExpressionAttributeValues: {
            ":l": "<" + language + "&",
        },
    };
    const param2: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "begins_with(language_category_title, :l)",
        ExpressionAttributeValues: {
            ":l": "<" + language + "&",
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
const dbpostOriginalText = async (tenant: string, title: string, category: string, text: string, comment: string, link: string) => {
    //PUT new Text in original language with its metadata inside a Tenant
    //input: tenant(String), title(String), category(String), text(String), comment(String), link(String)
    //output: true / Error

    //get categories of the tenant
    const tenantinfo = await (dbgetTenantinfo(tenant)) as Tenant;
    if (tenantinfo == null)
        throw { "error": "tenant does not exist" };

    //check if this text already exists
    if (await (dbGetTexts(tenant, tenantinfo.defaultLanguage, category, title)) as Text[])
        throw { "error": "text already present" };

    //check language is inside the tenant and check if category exists
    if (tenantinfo.defaultLanguage === tenantinfo.defaultLanguage || tenantinfo.languages.indexOf(tenantinfo.defaultLanguage) === -1 || tenantinfo.categories.findIndex(item => item.id === category) === -1)
        throw { "error": "missing language or category inside tenant" };

    const paramsInfo: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + tenantinfo.defaultLanguage + "&" + category + "\\" + title + ">",
            comment: comment,
            link: link,
            feedback: null,
        },
    };
    const paramsText: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + tenantinfo.defaultLanguage + "&" + category + "\\" + title + ">",
            text: text,
            stato: 'testoOriginale',
        },
    };
    try {
        await ddbDocClient.send(new PutCommand(paramsText));
        return await ddbDocClient.send(new PutCommand(paramsInfo));
    } catch (err) {
        throw { err };
    }
};

const dbpostTranslation = async (tenant: string, title: string, category: string, language: string, comment: string, link: string) => {
    //PUT new Translation of one language inside a Tenant
    //input: tenant(String), title(String), category(String), language(String), comment(String), link(String)
    //output: true / Eror

    //check if this text already exists
    if (await (dbGetTexts(tenant, language, category, title)) as Text[])
        throw { "error": "text already present" };

    const tenantinfo: Tenant = await (dbgetTenantinfo(tenant));
    if (tenantinfo == null)
        throw { "error": "error" };

    //check language is inside the tenant and check if category exists
    if (tenantinfo.defaultLanguage === language || tenantinfo.languages.indexOf(language) === -1 || tenantinfo.categories.findIndex(item => item.id === category) === -1)
        throw { "error": "error" };

    //need to check if language is inside the tenant
    //need to check if category is inside the tenant or else add it

    const paramsInfo: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + language + "&" + category + "\\" + title + ">",
            comment: comment,
            link: link,
            feedback: null,
        },
    };
    const paramsText: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + language + "&" + category + "\\" + title + ">",
            text: null,
            stato: 'daTradurre',
        },
    };
    try {
        await ddbDocClient.send(new PutCommand(paramsText));
        return await ddbDocClient.send(new PutCommand(paramsInfo));
    } catch (err) {
        throw { err };
    }
};

//__________UPDATE__________
const dbputTextCategory = async (tenant: string, category: string, title: string, name: string) => {
    //UPDATE the category of an original text and all its translations
    //input: tenant(String), category(String), name(String)
    //output: true / Errror

    try {
        const param: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "idTenant = :t and contains(language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\" + title + ">",
            }
        };
        const txt = await (await ddbDocClient.send(new ScanCommand(param))).Items as TextCategory[];
        //change all categories ID and prepare an array of PutRequest
        let array = [];
        txt.forEach(item => {
            item.language_category_title = item.language_category_title.split("&")[0].split("<")[1] + "#" + name + "#" + item.language_category_title.split(">")[0].split("\\")[1] + "#";
            array.push({ PutRequest: { Item: item } });
        });
        //prepare the parameters for the batch write
        const paramBatch: BatchWriteCommandInput = {
            RequestItems: {
                [environment.dynamo.TextCategoryTable.tableName]: array
            }
        };
        await ddbDocClient.send(new BatchWriteCommand(paramBatch));
        return true;
    } catch (err) {
        throw { err };
    }

};

const dbputOriginalText = async (tenant: string, category: string, title: string, text: string, comment: string, link: string, change) => {
    //UPDATE the informations (text, comment and link) of a text  in native language inside a Tenant
    //change => if(true) UPDATE of the state of all its translations to 'daTradurre'
    //input: tenant(String), category(String), title(String), text(String), comment(String), link(String), change(Bool)
    //output: true / Error
    try {
        let language = await (dbgetDefaultLanguage(tenant));
        if (language == null)
            throw { "error": "error" };

        const paramstext: UpdateCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "\\" + title + ">",
            },
            UpdateExpression: "set text = {:t}",
            ExpressionAttributeValues: {
                ":t": text,
            },
        };
        await ddbDocClient.send(new UpdateCommand(paramstext));

        const paramsinfo: UpdateCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            Key: {
                idTenant: tenant,
                categoryIdtextId: "<" + language + "&" + category + "\\" + title + ">",
            },
            UpdateExpression: "set comment = {:c} and set link = {:l}",
            ExpressionAttributeValues: {
                ":c": comment,
                ":l": link,
            },
        };
        await ddbDocClient.send(new UpdateCommand(paramsinfo));

        if (change) {
            utilChangeStateTranslations(tenant, language as string, category, title, state.daTradurre);
        }
        return true;

    } catch (err) {
        throw { err };
    }
};

const dbputTranslation = async (tenant: string, language: string, id: string, text: Text, stato: state, feedback: string) => {
    //UPDATE the data (text, state, feedback) of a translation inside a Tenant
    //input: tenant, language, textId, Text, text, state, feedback.
    //output: true / Error

    try {
        const params: UpdateCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: language + "#" + id,
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

const updateText = async (tenantID: string, language: string, category: string, id: string, state: state) => {

    var params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenantID,
            language_category_title: language + "#" + category + "#" + id
        }
    };
    params["UpdateExpression"] = "SET #state = :newState";
    params["ExpressionAttributeNames"] =
    {
        "#state": "state",
    };
    params["ExpressionAttributeValues"] =
    {
        ":newState": state,
    };

    try {
        const data = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", data);

    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
}

export { dbgetAllTexts, dbgetByCategory, dbgetByLanguage, dbgetTexts, dbgetTranslationsLanguages, dbGetTexts, textsOfState, dbdeleteText, dbdeleteLanguageTexts, dbpostOriginalText, dbpostTranslation, dbputTextCategory, dbputOriginalText, dbputTranslation, updateText };