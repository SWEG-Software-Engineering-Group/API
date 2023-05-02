import { GetCommand, GetCommandInput, BatchWriteCommand, BatchWriteCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from 'src/environment/environment';
import { Text } from "src/types/Text";

import { TextCategory, state } from "src/types/TextCategory";
import { Tenant, Category } from "src/types/Tenant";
import { ddbDocClient } from "./dbConnection";
import { dbgetTenantinfo, dbgetCategories, dbgetDefaultLanguage } from "./dbTenant";
import { TextCategoryInfo } from "src/types/TextCategoryinfo";



//NOTE: language_category_title is formatted: " <language&category\title> "
//          "<" + language + "&" + category + "\\" + title + ">"
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
        const params: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "#" + category + "#" + title + "#",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const info = (await ddbDocClient.send(new QueryCommand(params))).Items as TextCategoryInfo[];

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
                UpdateExpression: "set #state = {:s}",
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
            if (data == null)
                throw { "error": "error mergind metadata" };
            result.push(data);
        });
        //return all the data
        return result;
    } catch (err) {
        console.log(err);
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
                ":c": "&" + category + "\\",
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
                ":c": "&" + category + "\\",
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
                ":lc": "<" + language + "&" + category + "\\",
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
                ":lc": "<" + language + "&" + category + "\\",
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

const dbgetSingleText = async (tenant: string, language: string, category: string, title: string) => {
    //QUERY and return all Texts from a Category within a language of one Tenant
    //input: tenant(String), language(String), category(String)
    //output: Text[] / Error
    try {
        const categories: Category[] = await (dbgetCategories(tenant));
        if (categories == null)
            throw { "error": "couldn't collect the categories" };

        const getparamT: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "\\" + title + " >",
            }
        };
        const getparamI: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "\\" + title + " >",
            }
        };
        const text = (await ddbDocClient.send(new GetCommand(getparamT))).Item as TextCategory;
        const info = (await ddbDocClient.send(new GetCommand(getparamI))).Item as TextCategoryInfo;
        if (text != null) {
            return ({
                idTenant: text.idTenant,
                language: language,
                category: categories.find(element => element.id === category),
                title: title,
                text: text.text,
                stato: text.stato,
                comment: info.comment,
                link: info.link,
                feedback: info.feedback,
            } as Text);
        } else {
            return null;
        }

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
            throw { "error": "couldn't retrieve the default language" };

        //request all the data from the Text and metadata tables
        const param: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant= :t and contains(#language_category_title,:lc)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\" + title + ">",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new QueryCommand(param))).Items as TextCategory[];
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
        throw { err };
    }

}

const dbgetCategoryLanguages = async (tenant: string, category: string) => {
    //GET all the text count for each languages inside a category.
    //input: tenant(String), category:(String)
    //output: languages[] / Error

    try {
        //request all the data from the Text and metadata tables
        const param: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant= :t and contains(#language_category_title,:lc)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
            ProjectionExpression: "language_category_title",
        };
        const txt = await (await ddbDocClient.send(new QueryCommand(param))).Items as TextCategoryInfo[];
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
        throw { err };
    }

}

const dbGetTexts = async (tenantID: string, language: string = null, category: string = null, id: string = null) => {
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
                ':begin': "<" + language + "&" + ((category == null) ? "" : (category + "\\" + (id == null) ? "" : (id + ">"))),
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
                ':begin': "<" + language + "&" + ((category == null) ? "" : (category + "\\" + (id == null) ? "" : (id + ">"))),
                ':tenant': tenantID,
            }
        };

        const text = await (await ddbDocClient.send(new QueryCommand(params))).Items as TextCategory[];
        const info = await (await ddbDocClient.send(new QueryCommand(paramsinfo))).Items as TextCategoryInfo[];
        var data = [];
        text.forEach(function (text) {
            //iterate over every row of Text table
            let merge = utilMergeMeta(text, info, tenantinfo.categories);
            if (merge == null)
                throw { "error": "error mergind metadata" };
            data.push(merge);
        });
        console.log("Success - GET", data);
        return data as Text[];
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
    try {
        const categories: Category[] = await (dbgetCategories(tenantID));
        if (categories == null)
            throw { "error": "couldn't collect the categories" };

        var params: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :tenant and begins_with(#language_category_title, :begin)",
            FilterExpression: "#stato=:stato",
            ExpressionAttributeNames: {
                "#language_category_title": "language_category_title",
                '#idTenant': 'idTenant',
                '#stato': 'stato',
            },
            ExpressionAttributeValues: {
                ':begin': "<" + language + "&",
                ':tenant': tenantID,
                ':stato': state,
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
            if (merge == null)
                throw { "error": "error mergind metadata" };
            data.push(merge);
        });

        console.log("Success - GET", data);

        //filtra qui gli oggetti rimuovendo i duplicati
        //var text: TextCategory[] = data.Items as TextCategory[];

        return data as Text[];

    } catch (err) {
        console.log("Error", err.stack);
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
    const param1: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "contains(#language_category_title, :ct)",
        ExpressionAttributeValues: {
            ":ct": "&" + category + "\\" + title + ">",
        },
        ExpressionAttributeNames: {
            "#language_category_title": "language_category_title",
        },
    };
    const param2: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "contains(#language_category_title, :ct)",
        ExpressionAttributeValues: {
            ":ct": "&" + category + "\\" + title + ">",
        },
        ExpressionAttributeNames: {
            "#language_category_title": "language_category_title",
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
        ConditionExpression: "begins_with(#language_category_title, :l)",
        ExpressionAttributeValues: {
            ":l": "<" + language + "&",
        },
        ExpressionAttributeNames: {
            "#language_category_title": "language_category_title",
        },
    };
    const param2: DeleteCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Key: {
            idTenant: tenant,
        },
        ConditionExpression: "begins_with(#language_category_title, :l)",
        ExpressionAttributeValues: {
            ":l": "<" + language + "&",
        },
        ExpressionAttributeNames: {
            "#language_category_title": "language_category_title",
        },
    };
    try {
        await ddbDocClient.send(new DeleteCommand(param1));
        return await ddbDocClient.send(new DeleteCommand(param2));
    } catch (err) {
        throw { err };
    }
};

const dbdeleteCategoryTexts = async (tenant: string, category: string) => {
    //DELETE all texts that are inside a category.
    //input: tenant(String), category(String)
    //output: true / Error
    try {
        const param1: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const param2: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new QueryCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new QueryCommand(param2))).Items as TextCategoryInfo[];

        //prepare the DeleteRequest with all the Keys needed
        let text = [];
        txt.forEach(item => {
            text.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: item.language_category_title } } });
        });
        let info = [];
        meta.forEach(item => {
            info.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: item.language_category_title } } });
        });

        //delete the texts with the old category
        let paramBatch: BatchWriteCommandInput = {
            RequestItems: {
                [environment.dynamo.TextCategoryTable.tableName]: text,
                [environment.dynamo.TextCategoryInfoTable.tableName]: info
            }
        };
        await ddbDocClient.send(new BatchWriteCommand(paramBatch));

        return true;
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
    const original: Text = await (dbgetSingleText(tenant, tenantinfo.defaultLanguage, category, title)) as Text
    if (original != null) {
        throw { "error": "text already present" };
    }

    //check if the category is present inside the tenant

    //if (tenantinfo.categories.findIndex(item => item.id === category) === -1)
    //    throw { "error": "Missing category inside the tenant" };

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
            stato: state.testoOriginale,
        },
    };
    try {
        await ddbDocClient.send(new PutCommand(paramsText));
        return await ddbDocClient.send(new PutCommand(paramsInfo));
    } catch (err) {
        console.log("Error", err.stack);
        throw { "error": "errore nel db per la funzione dbpostOriginalText" };
    }
};

const dbpostTranslation = async (tenant: string, title: string, category: string, language: string, comment: string, link: string) => {
    //PUT new Translation of one language inside a Tenant
    //input: tenant(String), title(String), category(String), language(String), comment(String), link(String)
    //output: true / Eror
    const tenantinfo: Tenant = await (dbgetTenantinfo(tenant));
    if (tenantinfo == null)
        throw { "error": "Tenant doesn't exists" };
    //check if this text already exists
    const translation: Text = await (dbgetSingleText(tenant, language, category, title)) as Text
    if (translation != null) {
        throw { "error": "text already present" };
    }

    //check language is inside the tenant and check if category exists
    if (tenantinfo.defaultLanguage === language) {
        throw { "error": "lingua default" };
    }
    if (tenantinfo.languages.indexOf(language) === -1) {
        throw { "error": "lingua non esiste" };
    }
    if (tenantinfo.categories.findIndex(item => { return item.id === category }) === -1) {
        throw { "error": "categoria non esiste" };
    }

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
            stato: state.daTradurre,
        },
    };
    try {
        await ddbDocClient.send(new PutCommand(paramsText));
        return await ddbDocClient.send(new PutCommand(paramsInfo));
    } catch (err) {
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

    try {
        //grab all texts
        const param1: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            KeyConditionExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\" + title + ">",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const param2: QueryCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            KeyConditionExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
            ExpressionAttributeValues: {
                ":t": tenant,
                ":ct": "&" + category + "\\" + title + ">",
            },
            ExpressionAttributeNames: {
                "#idTenant": "idTenant",
                "#language_category_title": "language_category_title",
            },
        };
        const txt = await (await ddbDocClient.send(new QueryCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new QueryCommand(param2))).Items as TextCategoryInfo[];

        //change all categories ID and prepare an array of PutRequest
        let text = [];
        txt.forEach(item => {
            item.language_category_title = item.language_category_title.split("&")[0].split("<")[1] + "#" + newcategory + "#" + item.language_category_title.split(">")[0].split("\\")[1] + "#";
            text.push({ PutRequest: { Item: item } });
        });
        let info = [];
        meta.forEach(item => {
            item.language_category_title = item.language_category_title.split("&")[0].split("<")[1] + "#" + newcategory + "#" + item.language_category_title.split(">")[0].split("\\")[1] + "#";
            info.push({ PutRequest: { Item: item } });
        });

        //prepare the parameters for the batch write
        let paramBatch: BatchWriteCommandInput = {
            RequestItems: {
                [environment.dynamo.TextCategoryTable.tableName]: text,
                [environment.dynamo.TextCategoryInfoTable.tableName]: info
            }
        };
        await ddbDocClient.send(new BatchWriteCommand(paramBatch));

        //prepare the DeleteRequest with all the Keys needed
        text = [];
        txt.forEach(item => {
            text.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: item.language_category_title } } });
        });
        info = [];
        meta.forEach(item => {
            info.push({ DeleteRequest: { Key: { idTenant: tenant, language_category_title: item.language_category_title } } });
        });

        //delete the texts with the old category
        paramBatch = {
            RequestItems: {
                [environment.dynamo.TextCategoryTable.tableName]: text,
                [environment.dynamo.TextCategoryInfoTable.tableName]: info
            }
        };
        await ddbDocClient.send(new BatchWriteCommand(paramBatch));

        return true;
    } catch (err) {
        throw { err };
    }

};

const dbputOriginalText = async (tenant: string, category: string, title: string, text: string, comment: string | null, link: string | null) => {
    //UPDATE the informations (text, comment and link) of a text  in native language inside a Tenant
    //if(text change) UPDATE of the state of all its translations to 'daTradurre'
    //if(comment or link change) UPDATE of comment and link of all its translations
    //input: tenant(String), category(String), title(String), text(String), comment(String), link(String), change(Bool)
    //output: true / Error
    try {
        //get original language
        let language = await (dbgetDefaultLanguage(tenant));
        if (language == null)
            throw { "error": "error" };

        //get the current text informations
        const getparamT: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "\\" + title + " >",
            }
        };
        const getparamI: GetCommandInput = {
            TableName: environment.dynamo.TextCategoryInfoTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "\\" + title + " >",
            }
        };
        const currtext = (await ddbDocClient.send(new GetCommand(getparamT))).Item as TextCategory;
        const currinfo = (await ddbDocClient.send(new GetCommand(getparamI))).Item as TextCategoryInfo;
        if (currtext == null || currinfo == null)
            throw { "error": "original text not found" };

        //it text is modified than all translation return to be retranslated
        if (currtext.text !== text) {
            //change original text
            const paramstext: UpdateCommandInput = {
                TableName: environment.dynamo.TextCategoryTable.tableName,
                Key: {
                    idTenant: tenant,
                    language_category_title: "<" + language + "&" + category + "\\" + title + ">",
                },
                UpdateExpression: "set #text = {:t}",
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
            //change original text
            let paramsinfo: UpdateCommandInput = {
                TableName: environment.dynamo.TextCategoryInfoTable.tableName,
                Key: {
                    idTenant: tenant,
                    categoryIdtextId: "<" + language + "&" + category + "\\" + title + ">",
                },
                UpdateExpression: "set #comment = {:c} and set #link = {:l}",
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
            const languages = await dbgetTranslationsLanguages(tenant, category, title);
            await Promise.all(languages.map(async (lang) => {
                paramsinfo = {
                    TableName: environment.dynamo.TextCategoryInfoTable.tableName,
                    Key: {
                        idTenant: tenant,
                        categoryIdtextId: "<" + lang + "&" + category + "\\" + title + ">",
                    },
                    UpdateExpression: "set #comment = {:c} and set #link = {:l}",
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
        return true;

    } catch (err) {
        throw { err };
    }
};

const dbputTranslation = async (tenant: string, title: string, category: string, language: string, text: Text, stato: state, feedback: string) => {
    //UPDATE the data (text, state, feedback) of a translation inside a Tenant
    //input: tenant(string), title(string), category(string), language(string), Text(string), state(string), feedback(string).
    //output: true / Error

    try {
        const params: UpdateCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "\\" + title + ">",
            },
            UpdateExpression: "set #text = :t and set #stato = :s",
            ExpressionAttributeValues: {
                ":t": text,
                ":s": stato,
            },
            ExpressionAttributeNames: {
                "#text": "text",
                "#stato": "state",
            },
        };
        const paramsinfo: UpdateCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
                language_category_title: "<" + language + "&" + category + "\\" + title + ">",
            },
            UpdateExpression: "set #feedback = :f",
            ExpressionAttributeValues: {
                ":f": feedback,
            },
            ExpressionAttributeNames: {
                "#feedback": "feedback",
            },
        };
        await ddbDocClient.send(new UpdateCommand(params));
        await ddbDocClient.send(new UpdateCommand(paramsinfo));
        return true;
    } catch (err) {
        throw { err };
    }
};

const updateText = async (tenantID: string, language: string, category: string, title: string, state: state) => {

    var params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenantID,
            language_category_title: "<" + language + "&" + category + "\\" + title + ">"
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

export { dbgetAllTexts, dbgetTexts, dbgetSingleText, dbgetTranslationsLanguages, dbgetCategoryLanguages, dbGetTexts, textsOfState, dbdeleteText, dbdeleteLanguageTexts, dbdeleteCategoryTexts, dbpostOriginalText, dbpostTranslation, dbputTextCategory, dbputOriginalText, dbputTranslation, updateText };