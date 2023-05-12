import { GetCommand, GetCommandInput, BatchWriteCommand, BatchWriteCommandInput, ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from "../../src/environment/environment";
import { Text } from "../../src/types/Text";

import { TextCategory, state } from "../../src/types/TextCategory";
import { Tenant, Category } from "../../src/types/Tenant";
import { ddbDocClient } from "./dbConnection";
import { dbgetTenantinfo, dbgetCategories, dbgetDefaultLanguage } from "./dbTenant";
import { TextCategoryInfo } from "../../src/types/TextCategoryinfo";



//NOTE: language_category_title is formatted: " <language&category'title> "
//          "<" + language + "&" + category + "'" + title + ">"
//using charactes <&\> that are escaped by the lambda to avoid conflict with user input
//lang      = language_category_title.split("&")[0].split("<")[1];
//category  = language_category_title.split("'")[0].split("&")[1];
//title     = language_category_title.split(">")[0].split("'")[1];
//split("&")[0].split("<")[1].split("'")[0].split("&")[1]..split(">")[0].split("'")[1];

//---------------------
//UTIL functions that will be used across all db functions 
//to make the code more simple and compact
//---------------------
const utilMergeMeta = (text: TextCategory, info: TextCategoryInfo[], categories: Category[]) => {
    console.log("inside utilMergeMeta", text, info, categories);
    //custum util function to help merge the text with it's metadata
    //input: text(TextCategory), info(TextCategoryInfo[]), categories(Category[])
    //output: Text / Error
    try {
        let lang = text.language_category_title.split("&")[0].split("<")[1];
        let category = text.language_category_title.split("'")[0].split("&")[1];
        let title = text.language_category_title.split(">")[0].split("'")[1];
        //seach the meta by textId
        let meta = info.find(element => element.language_category_title === text.language_category_title);
        console.log("meta: ", meta);
        if (meta === null)
            return null;
        //construct the object merging records from the two tables
        return ({
            idTenant: text.idTenant,
            language: lang,
            //get the name based on the categoryId
            category: categories.find(element => element.id === category),
            title: title,
            text: text.text,
            state: text.state,
            comment: meta.comment,
            link: meta.link,
            feedback: meta.feedback,
        } as Text);
    }
    catch (err) {
        console.log("ERROR inside utilMergeMeta", err);
        throw { err };
    }
}

const utilChangeStateTranslations = async (tenant: string, defaultlanguage: string, category: string, title: string, state: state) => {
    //custum util function to help changin all the states of translations to 'daTradurre' or other when an original text is changed
    //input: tenant(String), defaultlanguage(String), category(String), title(String), state(state)
    //output: True / Error
    console.log("inside utilChangeStateTranslations");
    try {
        const params: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, : ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "'" + title + ">",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
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
                UpdateExpression: "set #state = :s",
                ExpressionAttributeValues: {
                    ":s": state,
                },
                ExpressionAttributeNames: {
                    "#state": "state",
                }
            };
            await ddbDocClient.send(new UpdateCommand(update));
        }));

    }
    catch (err) {
        console.log("ERROR inside utilChangeStateTranslations", err);
        throw { err };
    }
}

//---------------------
//DB functions that will be called by the LAMBDA API calls
//---------------------

//__________GET__________
const dbgetAllTexts = async (tenant: string) => {
    //QUERY and return all Texts from one Tenant
    //input: tenant(String)
    //output: Text[] / Error
    console.log("inside dbgetAllTexts", tenant);
    try {
        //get categories of the tenant
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "error" };
        //request all the data from the Text and metadata tables
        const param1: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :t",
            ExpressionAttributeValues: { ":t": tenant },
            ExpressionAttributeNames: { "#idTenant": "idTenant", },
        };
        const param2: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :t",
            ExpressionAttributeValues: { ":t": tenant },
            ExpressionAttributeNames: { "#idTenant": "idTenant", },
        };
        const info = await (await ddbDocClient.send(new QueryCommand(param1))).Items as TextCategoryInfo[];
        const txt = await (await ddbDocClient.send(new QueryCommand(param2))).Items as TextCategory[];
        console.log("dbgetAllTexts: " + txt);
        console.log("dbgetAllTexts: " + info);
        if (info == null || txt == null)
            throw { "error": "error reading texts from db" };
        if (info.length === 0 || txt.length === 0) {
            throw { "error": "No data in db" };
        }
        //merge the data together between texts and infos
        var result = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let data = utilMergeMeta(text, info, categories);
            if (data == null) {
                dbdeleteSingleText(tenant, text.language_category_title);
                return;
            }
            result.push(data);
        });
        info.forEach(function (text) {
            //check if there are any leftovers
            if (txt.findIndex(t => t.language_category_title === text.language_category_title) === -1) {
                dbdeleteSingleText(tenant, text.language_category_title);
            }
        });
        //return all the data
        return result;
    } catch (err) {
        console.log("ERROR inside dbgetAllTexts", err);
        throw { err };
    }
};

/*
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
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": "&" + category + "'",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },

        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": "&" + category + "'",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
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
            FilterExpression: "#idTenant = :t and begins_with(#language_category_title, :l)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": "<" + language + "&",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "#idTenant = :t and begis_with(#language_category_title, :l) and #state= :s",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": "<" + language + "&",
                ":s": state,
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
                "#state": "state",
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
*/
const dbgetTexts = async (tenant: string, language: string, category: string) => {
    //QUERY and return all Texts from a Category within a language of one Tenant
    //input: tenant(String), language(String), category(String)
    //output: Text[] / Error
    console.log("inside dbgetTexts", tenant, language + "&" + category);
    try {
        //get categories of the tenant
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "error" };

        //request all the data from the Text and metadata tables
        const param1: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :t and begins_with(#language_category_title,:lc)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":lc": "<" + language + "&" + category + "'",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const param2: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant= :t and begins_with(#language_category_title,:lc)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":lc": "<" + language + "&" + category + "'",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const info = await (await ddbDocClient.send(new QueryCommand(param1))).Items as TextCategoryInfo[];
        const txt = await (await ddbDocClient.send(new QueryCommand(param2))).Items as TextCategory[];
        if (info == null || txt == null)
            throw { "error": "error reading texts from db" };

        //merge the data together between texts and infos
        var result = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let data = utilMergeMeta(text, info, categories);
            if (data == null) {
                dbdeleteSingleText(tenant, text.language_category_title);
                return;
            }
            result.push(data);
        });
        //return all the data
        return result;
    } catch (err) {
        console.log("ERROR inside dbgetTexts", err);
        throw { err };
    }
};

const dbgetSingleText = async (tenant: string, language: string, category: string, title: string) => {
    //QUERY and return all Texts from a Category within a language of one Tenant
    //input: tenant(String), language(String), category(String)
    //output: Text[] / Error
    console.log("inside dbgetSingleText", "<" + language + "&" + category + "'" + title + ">");

    try {
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "couldn't collect the categories" };

        let stringT = "<" + language + "&" + category + "'" + title + ">"
        let decodeUri = decodeURI(stringT)
        stringT = stringT.replace(/%20/g, " ");
        console.log(stringT);
        console.log(decodeUri)
        console.log(tenant);
        const getparamT: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: stringT,
            }
        };
        const getparamI: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: stringT,
            }
        };
        const text = (await ddbDocClient.send(new GetCommand(getparamT))).Item as TextCategory;
        const info = (await ddbDocClient.send(new GetCommand(getparamI))).Item as TextCategoryInfo;
        console.log(text);
        console.log(info);
        if (text != null) {
            return ({
                idTenant: text.idTenant,
                language: language,
                category: categories.find(element => element.id === category),
                title: title,
                text: text.text,
                state: text.state,
                comment: info.comment,
                link: info.link,
                feedback: info.feedback,
            } as Text);
        } else {
            console.log("failed to retrieve text")
            return false;
        }

    } catch (err) {
        console.log("ERROR inside dbgetSingleText", err);
        throw { err };
    }
};

const dbgetTranslationsLanguages = async (tenant: string, category: string, title: string) => {
    //GET all the languages an original text is translated to.
    //input: tenant(String), category:(String), title(String)
    //output: String[] / Error
    console.log("inside dbgetTranslationLanguages", "&" + category + "'" + title + ">");
    try {
        //get categories of the tenant
        const deflang = await (dbgetDefaultLanguage(tenant));
        if (deflang == null)
            throw { "error": "couldn't retrieve the default language" };

        //request all the data from the Text and metadata tables
        const param: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "'" + title + ">",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new ScanCommand(param))).Items as TextCategory[];
        if (txt == null)
            throw { "error": "error reading texts from db" };

        //merge the data together between texts and infos
        var result: string[] = [];

        txt.forEach(function (text) {
            //iterate over every row of Text table
            let language = text.language_category_title.split("&")[0].split("<")[1];
            if (language !== deflang)
                result.push(language);
        });
        //return all the data
        return result;
    } catch (err) {
        console.log("ERROR inside dbgetTranslationLanguages", err);
        throw { err };
    }

}

const dbgetCategoryLanguages = async (tenant: string, category: string) => {
    //GET all the text count for each languages inside a category.
    //input: tenant(String), category:(String)
    //output: languages[] / Error
    console.log("inside dbgetCategoryLanguages", "&" + category + "'");
    try {
        //request all the data from the Text and metadata tables
        const param: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, : ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "'",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new ScanCommand(param))).Items as TextCategoryInfo[];
        if (txt == null)
            throw { "error": "error reading texts from db" };
        let languages = [];
        for (var i = 0; i < txt.length; i++)
            languages.push(txt[i].language_category_title.split("&")[0].split("<")[1]);

        return languages.reduce((acc: { [key: string]: number; }, current: string) => {
            const amount = acc[current] ?? 0; // or could do || 0;
            acc[current] = amount + 1;
            return acc;
        }, {}); // { A: 4, B: 2, C: 1 };
        // source: https://stackoverflow.com/questions/65670439/group-elements-in-an-array-with-count

    } catch (err) {
        console.log("ERROR inside dbgetCategoryLanguages", err);
        throw { err };
    }

}

const dbGetTexts = async (tenantID: string, language: string = null, category: string = null, id: string = null) => {
    console.log("inside dbGetTexts", "<" + language + "&" + category + "'" + id + ">");
    try {
        const tenantinfo = await (dbgetTenantinfo(tenantID)) as Tenant;
        if (tenantinfo == null)
            throw { "error": "tenant does not exist" };
        //caso lingua = null ritorna la lingua di default
        if (language == null) {
            language = tenantinfo.defaultLanguage;
        }
        var params: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :tenant and begins_with(#language_category_title, :begin)",
            ExpressionAttributeNames: {
                "#language_category_title": "language_category_title",
                '#idTenant': 'idTenant',
            },
            ExpressionAttributeValues: {
                ':begin': "<" + language + "&" + ((category == null) ? "" : (category + "'" + (id == null) ? "" : (id + ">"))),
                ':tenant': tenantID,
            }
        };
        var paramsinfo: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :tenant and begins_with(#language_category_title, :begin)",
            ExpressionAttributeNames: {
                "#language_category_title": "language_category_title",
                '#idTenant': 'idTenant',
            },
            ExpressionAttributeValues: {
                ':begin': "<" + language + "&" + ((category == null) ? "" : (category + "'" + (id == null) ? "" : (id + ">"))),
                ':tenant': tenantID,
            }
        };

        const text = await (await ddbDocClient.send(new QueryCommand(params))).Items as TextCategory[];
        const info = await (await ddbDocClient.send(new QueryCommand(paramsinfo))).Items as TextCategoryInfo[];
        var data = [];
        text.forEach(function (text) {
            //iterate over every row of Text table
            let merge = utilMergeMeta(text, info, tenantinfo.categories);
            if (data == null) {
                dbdeleteSingleText(tenantID, text.language_category_title);
                return;
            }
            data.push(merge);
        });
        console.log("Success - GET", data);
        return data as Text[];
    } catch (err) {
        console.log("ERROR inside dbGetTexts", err);
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
            var current = val["language_category_title"].split("'")[0].split("&")[1];
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
    console.log("inside textOfStatw", "<" + language + "&", state);
    try {
        const categories: Category[] = await (dbgetCategories(tenantID));
        if (categories == null)
            throw { "error": "couldn't collect the categories" };

        var params: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :tenant and begins_with(#language_category_title, :begin)",
            FilterExpression: "#state=:state",
            ExpressionAttributeNames: {
                "#language_category_title": "language_category_title",
                '#idTenant': 'idTenant',
                '#state': 'state',
            },
            ExpressionAttributeValues: {
                ':begin': "<" + language + "&",
                ':tenant': tenantID,
                ':state': state,
            }
        };
        var paramsinfo: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :tenant and begins_with(#language_category_title, :begin)",
            ExpressionAttributeNames: {
                "#language_category_title": "language_category_title",
                '#idTenant': 'idTenant',
            },
            ExpressionAttributeValues: {
                ':begin': "<" + language + "&",
                ':tenant': tenantID,
            }
        };

        const text = await (await ddbDocClient.send(new QueryCommand(params))).Items as TextCategory[];
        const info = await (await ddbDocClient.send(new QueryCommand(paramsinfo))).Items as TextCategoryInfo[];
        var data = [];
        text.forEach(function (text) {
            //iterate over every row of Text table
            let merge = utilMergeMeta(text, info, categories);
            if (data == null) {
                dbdeleteSingleText(tenantID, text.language_category_title);
                return;
            }
            data.push(merge);
        });

        console.log("Success - GET", data);

        //filtra qui gli oggetti rimuovendo i duplicati
        //var text: TextCategory[] = data.Items as TextCategory[];

        return data as Text[];

    } catch (err) {
        console.log("ERROR inside textsOfState", err.stack);
        throw { err };
    }
}


//__________DELETE__________
const dbdeleteText = async (tenant: string, title: string, category: string) => {
    //DELETE a specific Text inside a Category. This will cause the deletion of the text in every language.
    //input: tenant(String), title(String), category(String)
    //output: true / Error

    //for the chance of errors first it performs the delete of all texts, then it deletes all the metadata.
    //it is acceptable but not ideal that there is some metadata leftover without an actual text in any language.
    //it is not acceptable to have any texts leftover without its metadata counterpart.
    console.log("inside dbdeleteText", "&" + category + "'" + title + ">");

    if (! await dbgetSingleText(tenant, await dbgetDefaultLanguage(tenant), category, title))
        throw { "Error": "this text doesn't exist" };

    const param1: ScanCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        FilterExpression: "#idTenant = :t and contains(#language_category_title, : ct)",
        ExpressionAttributeValues: {
            ":t": tenant,
            ":ct": "&" + category + "'" + title + ">",
        },
        ExpressionAttributeNames: {
            "#idTenant": "idTenant",
            "#language_category_title": "language_category_title",
        },
    };
    const param2: ScanCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        FilterExpression: "#idTenant = :t and contains(#language_category_title, : ct)",
        ExpressionAttributeValues: {
            ":t": tenant,
            ":ct": "&" + category + "'" + title + ">",
        },
        ExpressionAttributeNames: {
            "#idTenant": "idTenant",
            "#language_category_title": "language_category_title",
        },
    };
    try {
        const txt = await (await ddbDocClient.send(new QueryCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new QueryCommand(param2))).Items as TextCategoryInfo[];

        //if there is nothing skip
        if (txt.length === 0 && meta.length === 0)
            return true;

        //prepare the DeleteRequest with all the Keys needed

        let array = [];
        let request = [];

        //split all the texts in batches of 25
        while (txt.length !== 0) {
            let temp = txt.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        //request = request.splice(0, request.length);

        //split all the infos in batches of 25
        while (meta.length !== 0) {
            let temp = meta.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        console.log(array);
        //mapp all the calls and send them in parallel
        await Promise.all(array.map(async (element) => {
            await ddbDocClient.send(new BatchWriteCommand(element));
        }));
        return true;

    } catch (err) {
        console.log("ERROR inside dbdeleteText", err.stack);
        throw { err };
    }
};

const dbdeleteSingleText = async (tenant: string, language_category_title: string) => {
    //DELETE a specific Text inside a Category. This will cause the deletion of the text in every language.
    //input: tenant(String), title(String), category(String)
    //output: true / Error

    //for the chance of errors first it performs the delete of all texts, then it deletes all the metadata.
    //it is acceptable but not ideal that there is some metadata leftover without an actual text in any language.
    //it is not acceptable to have any texts leftover without its metadata counterpart.
    console.log("inside dbdeleteSingleText", language_category_title);
    const param1: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            language_category_title: language_category_title,
        },
    };
    const param2: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Key: {
            idTenant: tenant,
            language_category_title: language_category_title,
        },
    };
    try {
        await ddbDocClient.send(new DeleteCommand(param1));
        return await ddbDocClient.send(new DeleteCommand(param2));
    } catch (err) {
        console.log("ERROR inside dbdeleteSingleText", err.stack);
        throw { err };
    }
};

const dbdeleteLanguageTexts = async (tenant: string, language: string) => {
    //DELETE all texts translated into a language.
    //input: tenant(String), language(String)
    //output: true / Error
    console.log("inside dbdeleteLanguageTexts", "<" + language + "&");
    try {
        const param1: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :t and begins_with(#language_category_title, :l)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": "<" + language + "&",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const param2: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :t and begins_with(#language_category_title, :l)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":l": "<" + language + "&",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new QueryCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new QueryCommand(param2))).Items as TextCategoryInfo[];

        //if there is nothing skip
        if (txt.length === 0 && meta.length === 0)
            return true;

        //prepare the DeleteRequest with all the Keys needed

        let array = [];
        let request = [];

        //split all the texts in batches of 25
        while (txt.length !== 0) {
            let temp = txt.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        //request = request.splice(0, request.length);

        //split all the infos in batches of 25
        while (meta.length !== 0) {
            let temp = meta.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        console.log(array);
        //mapp all the calls and send them in parallel
        await Promise.all(array.map(async (element) => {
            await ddbDocClient.send(new BatchWriteCommand(element));
        }));
        return true;
    } catch (err) {
        console.log("ERROR inside dbdeleteLanguageTexts", err.stack);
        throw { err };
    }
};

const dbdeleteCategoryTexts = async (tenant: string, category: string) => {
    //DELETE all texts that are inside a category.
    //input: tenant(String), category(String)
    //output: true / Error
    console.log("entering dbdeleteCategoryTexts");
    console.log(tenant, category);
    try {
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": "&" + category + "'",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :c)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":c": "&" + category + "'",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new ScanCommand(param2))).Items as TextCategoryInfo[];

        console.log("texts:", txt, "mata:", meta);

        //if there is nothing skip
        if (txt.length === 0 && meta.length === 0)
            return true;

        //prepare the DeleteRequest with all the Keys needed

        let array = [];
        let request = [];

        //split all the texts in batches of 25
        while (txt.length !== 0) {
            let temp = txt.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        //request = request.splice(0, request.length);

        //split all the infos in batches of 25
        while (meta.length !== 0) {
            let temp = meta.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        console.log("BatchList", array);
        //mapp all the calls and send them in parallel
        await Promise.all(array.map(async (element) => {
            await ddbDocClient.send(new BatchWriteCommand(element));
        }));
        console.log("dbDeleteCategoryTexts was a success");
        return true;
    } catch (err) {
        console.log("ERROR inside dbdeleteCategoryTexts", err.stack);
        throw { err };
    }
};

const dbdeleteAllTexts = async (tenant: string) => {
    //DELETE all texts.
    //input: tenant(String)
    //output: true / Error
    console.log("inside dbdeleteAllTexts");
    try {
        const param1: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :t",
            ExpressionAttributeValues: {
                ":t": tenant,
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
            },
        };
        const param2: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :t",
            ExpressionAttributeValues: {
                ":t": tenant,
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
            },
        };
        const txt = await (await ddbDocClient.send(new QueryCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new QueryCommand(param2))).Items as TextCategoryInfo[];

        //if there is nothing skip
        if (txt.length === 0 && meta.length === 0)
            return true;

        //prepare the DeleteRequest with all the Keys needed

        let array = [];
        let request = [];

        //split all the texts in batches of 25
        while (txt.length !== 0) {
            let temp = txt.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        //request = request.splice(0, request.length);

        //split all the infos in batches of 25
        while (meta.length !== 0) {
            let temp = meta.pop();
            request.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            if (request.length === 25) {
                array.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (request.length !== 0) {
            array.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryInfoTable.tableName]: request.splice(0, request.length),
                }
            } as BatchWriteCommandInput);
        }
        console.log(array);
        //mapp all the calls and send them in parallel
        await Promise.all(array.map(async (element) => {
            await ddbDocClient.send(new BatchWriteCommand(element));
        }));
        return true;
    } catch (err) {
        console.log("ERROR inside dbdeleteAllTexts", err.stack);
        throw { err };
    }
};

//__________PUT__________
const dbpostOriginalText = async (tenant: string, title: string, cat: string, text: string, comment: string, link: string) => {
    //PUT new Text in original language with its metadata inside a Tenant
    //input: tenant(String), title(String), category(String), text(String), comment(String), link(String)
    //output: true / Error

    //get categories of the tenant
    console.log("inside dbpostOriginalText", "&" + cat + "'" + title + ">");
    const tenantinfo = await (dbgetTenantinfo(tenant)) as Tenant;
    if (tenantinfo == null)
        throw { "error": "tenant does not exist" };
    const category = tenantinfo.categories.find(item => { return item.id === cat });
    if (category === undefined) {
        throw { "error": "categoria non esiste" };
    }

    //check if this text already exists
    const original = await (dbgetSingleText(tenant, tenantinfo.defaultLanguage, category.id, title))
    if (original != false) {
        console.log("text already present");
        throw { "error": "text already present" };
    }

    //check if the category is present inside the tenant

    //if (tenantinfo.categories.findIndex(item => item.id === category) === -1)
    //    throw { "error": "Missing category inside the tenant" };

    const paramsInfo: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + tenantinfo.defaultLanguage + "&" + category.id + "'" + title + ">",
            comment: comment,
            link: link,
            feedback: null,
        },
    };
    const paramsText: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + tenantinfo.defaultLanguage + "&" + category.id + "'" + title + ">",
            text: text,
            state: state.testoOriginale,
        },
    };
    try {
        await ddbDocClient.send(new PutCommand(paramsText));
        await ddbDocClient.send(new PutCommand(paramsInfo));
        return true;
    } catch (err) {
        console.log("ERROR inside dbpostOriginalText", err.stack);
        throw { "error": "errore nel db per la funzione dbpostOriginalText" };
    }
};

const dbpostTranslation = async (tenant: string, title: string, cat: string, language: string, comment: string, link: string) => {
    //PUT new Translation of one language inside a Tenant
    //input: tenant(String), title(String), category(String), language(String), comment(String), link(String)
    //output: true / Eror
    console.log("entering dbpostTranslation", "&" + cat + "'" + title + ">");
    const tenantinfo: Tenant = await (dbgetTenantinfo(tenant));
    if (tenantinfo == null)
        throw { "error": "Tenant doesn't exists" };
    const category = tenantinfo.categories.find(item => { return item.id === cat });
    if (category === undefined) {
        throw { "error": "categoria non esiste" };
    }
    //check if this text already exists
    const translation = await (dbgetSingleText(tenant, language, category.id, title));
    if (translation != false) {
        console.log("text already present");
        throw { "error": "text already present" };
    }
    //check language is inside the tenant and check if category exists
    if (tenantinfo.defaultLanguage === language) {
        throw { "error": "lingua default" };
    }

    const paramsInfo: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + language + "&" + cat + "'" + title + ">",
            comment: comment,
            link: link,
            feedback: null,
        },
    };
    const paramsText: PutCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Item: {
            idTenant: tenant,
            language_category_title: "<" + language + "&" + category.id + "'" + title + ">",
            text: null,
            state: state.daTradurre,
        },
    };
    try {
        await ddbDocClient.send(new PutCommand(paramsText));
        return await ddbDocClient.send(new PutCommand(paramsInfo));
    } catch (err) {
        console.log("ERROR inside dbPostTranslation", err.stack);
        throw { "errore": "errore nel db per la funzione ", "err2": err };
    }
};

//__________UPDATE__________
const dbputTextCategory = async (tenant: string, category: string, title: string, newcategory: string) => {
    //UPDATE the category of an original text and all its translations
    //input: tenant(String), category(String), name(String)
    //output: true / Errror

    //NOTE:
    //this function need to add partition to 100 elements for the batch
    console.log("inside putTextCategory", "&" + category + "'" + title, newcategory);
    try {
        //grab all texts
        const param1: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "'" + title + ">",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const param2: ScanCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "'" + title + ">",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new ScanCommand(param2))).Items as TextCategoryInfo[];

        //prepare the PutRequest and DeleteRequest with all the Keys needed

        let tempA = [];
        let tempB = [];
        let write = [];
        let cancel = [];

        //split all the texts in batches of 25
        while (txt.length !== 0) {
            let temp = txt.pop();
            tempB.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            temp.language_category_title = "<" + temp.language_category_title.split("&")[0].split("<")[1] + "&" + newcategory + "'" + temp.language_category_title.split(">")[0].split("'")[1] + ">";
            tempA.push({ PutRequest: { Item: temp } });
            if (tempB.length === 25) {
                cancel.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryTable.tableName]: tempB.splice(0, tempB.length),
                    }
                } as BatchWriteCommandInput);
            }
            if (tempA.length === 100) {
                write.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryTable.tableName]: tempA.splice(0, tempA.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (tempB.length !== 0) {
            cancel.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryTable.tableName]: tempB.splice(0, tempB.length),
                }
            } as BatchWriteCommandInput);
        }
        if (tempA.length !== 0) {
            write.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryTable.tableName]: tempA.splice(0, tempA.length),
                }
            } as BatchWriteCommandInput);
        }

        //split all the infos in batches of 25
        while (meta.length !== 0) {
            let temp = meta.pop();
            tempB.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: temp.language_category_title } } });
            temp.language_category_title = "<" + temp.language_category_title.split("&")[0].split("<")[1] + "&" + newcategory + "'" + temp.language_category_title.split(">")[0].split("'")[1] + ">";
            tempA.push({ PutRequest: { Item: temp } });
            if (tempB.length === 25) {
                cancel.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryInfoTable.tableName]: tempB.splice(0, tempB.length),
                    }
                } as BatchWriteCommandInput);
            }
            if (tempA.length === 100) {
                write.push({
                    RequestItems: {
                        [environment.dynamo.TextCategoryInfoTable.tableName]: tempA.splice(0, tempA.length),
                    }
                } as BatchWriteCommandInput);
            }
        }
        //case where there is leftover
        if (tempB.length !== 0) {
            cancel.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryInfoTable.tableName]: tempB.splice(0, tempB.length),
                }
            } as BatchWriteCommandInput);
        }
        if (tempA.length !== 0) {
            write.push({
                RequestItems: {
                    [environment.dynamo.TextCategoryInfoTable.tableName]: tempA.splice(0, tempA.length),
                }
            } as BatchWriteCommandInput);
        }
        console.log(write, write.length);
        console.log(cancel, cancel.length);
        //mapp all the calls and send them in parallel
        await Promise.all(write.map(async (element) => {
            await ddbDocClient.send(new BatchWriteCommand(element));
        }));

        await Promise.all(cancel.map(async (element) => {
            await ddbDocClient.send(new BatchWriteCommand(element));
        }));
        return true;
    } catch (err) {
        console.log("ERROR inside dbputTextCategory", err.stack);
        throw { err };
    }

};

const dbputOriginalText = async (tenant: string, category: string, title: string, text: string, comment: string | null, link: string | null, languages: string[]) => {
    //UPDATE the informations (text, comment and link) of a text  in native language inside a Tenant
    //if(text change) UPDATE of the state of all its translations to 'daTradurre'
    //if(comment or link change) UPDATE of comment and link of all its translations
    //input: tenant(String), category(String), title(String), text(String), comment(String), link(String), change(Bool)
    //output: true / Error
    try {
        //get original language
        console.log("inside putOriginalText", "&" + category + "'" + title, tenant);
        console.log(text, comment, link);
        let language = await (dbgetDefaultLanguage(tenant));
        if (language == null)
            throw { "error": "can't retrieve the default language" };
        console.log("<" + language + "&" + category + "'" + title + ">");
        //get the current text informations
        const getparamT: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "'" + title + ">",
            }
        };
        const getparamI: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "'" + title + ">",
            }
        };
        const currtext = (await ddbDocClient.send(new GetCommand(getparamT))).Item as TextCategory;
        const currinfo = (await ddbDocClient.send(new GetCommand(getparamI))).Item as TextCategoryInfo;
        console.log("GET: ", currtext, currinfo);
        if (currtext == null || currinfo == null)
            throw { "error": "original text not found" };
        console.log("GET with success");
        //it text is modified than all translation return to be retranslated
        if (currtext.text !== text) {
            //change original text
            console.log("text has changed", currtext.text, text);
            const paramstext: UpdateCommandInput = {
                TableName: environment.dynamo.TextCategoryTable.tableName,
                Key: {
                    idTenant: tenant,
                    language_category_title: "<" + language + "&" + category + "'" + title + ">",
                },
                UpdateExpression: "set #text = :t",
                ExpressionAttributeValues: {
                    ":t": text,
                },
                ExpressionAttributeNames: {
                    "#text": "text",
                },
            };
            await ddbDocClient.send(new UpdateCommand(paramstext));
            //change state of translations
            utilChangeStateTranslations(tenant, language as string, category, title, state.daTradurre);
        }

        //comment and link are replicated on every translation and needs to keep consistency
        if (currinfo.comment !== comment || currinfo.link !== link) {
            console.log("comment or link has changed", currinfo.comment, comment, currinfo.link, link);
            //change original text
            let paramsinfo: UpdateCommandInput = {
                TableName: environment.dynamo.TextCategoryInfoTable.tableName,
                Key: {
                    idTenant: tenant,
                    language_category_title: "<" + language + "&" + category + "'" + title + ">",
                },
                UpdateExpression: "set #comment = :c , #link = :l",
                ExpressionAttributeValues: {
                    ":c": comment,
                    ":l": link,
                },
                ExpressionAttributeNames: {
                    "#comment": "comment",
                    "#link": "link",
                },
            };
            await ddbDocClient.send(new UpdateCommand(paramsinfo));
            //get all translations and update each one
            await Promise.all(languages.map(async (lang) => {
                console.log("iterate for every language:", lang);
                paramsinfo = {
                    TableName: environment.dynamo.TextCategoryInfoTable.tableName,
                    Key: {
                        idTenant: tenant,
                        language_category_title: "<" + lang + "&" + category + "'" + title + ">",
                    },
                    UpdateExpression: "set #comment = :c , #link = :l",
                    ExpressionAttributeValues: {
                        ":c": comment,
                        ":l": link,
                    },
                    ExpressionAttributeNames: {
                        "#comment": "comment",
                        "#link": "link",
                    },
                };
                await ddbDocClient.send(new UpdateCommand(paramsinfo));
            }));
        }
        return dbgetSingleText(tenant, language, category, title);

    } catch (err) {
        console.log("ERROR inside dbputOriginalText", err.stack);
        throw { err };
    }
};

const dbputTranslation = async (tenant: string, title: string, category: string, language: string, text: Text, state: state) => {
    //UPDATE the data (text, state, feedback) of a translation inside a Tenant
    //input: tenant(string), title(string), category(string), language(string), Text(string), state(string), feedback(string).
    //output: true / Error

    try {
        console.log("inside putTranslation", language + "&" + category + "'" + title);
        const params: UpdateCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "'" + title + ">",
            },
            UpdateExpression: "set #text = :t , #state = :s",
            ExpressionAttributeValues: {
                ":t": text,
                ":s": state,
            },
            ExpressionAttributeNames: {
                "#text": "text",
                "#state": "state",
            },
        };
        await ddbDocClient.send(new UpdateCommand(params));
        return dbgetSingleText(tenant, language, category, title);
    } catch (err) {
        console.log("ERROR inside dbputTranslation", err.stack);
        throw { err };
    }
};

const updateText = async (tenantID: string, language: string, category: string, title: string, state: state) => {
    console.log("inside updateText", "<" + language + "&" + category + "'" + title + ">");
    try {
        await dbGetTexts(tenantID, language, category, title);
    } catch (err) {
        console.log("ERROR inside updateText", err.stack);
        throw { err };
    }
    var params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenantID,
            language_category_title: "<" + language + "&" + category + "'" + title + ">"
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
        console.log("ERROR inside updateText", err.stack);
        throw { err };
    }
}

export { dbgetAllTexts, dbgetTexts, dbgetSingleText, dbgetTranslationsLanguages, dbgetCategoryLanguages, dbGetTexts, textsOfState, dbdeleteText, dbdeleteSingleText, dbdeleteLanguageTexts, dbdeleteCategoryTexts, dbdeleteAllTexts, dbpostOriginalText, dbpostTranslation, dbputTextCategory, dbputOriginalText, dbputTranslation, updateText };