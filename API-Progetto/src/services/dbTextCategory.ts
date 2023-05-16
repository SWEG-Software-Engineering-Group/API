import { GetCommand, GetCommandInput, BatchWriteCommand, BatchWriteCommandInput, ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from "../../src/environment/environment";
import { Text } from "../../src/types/Text";

import { TextCategory, state } from "../../src/types/TextCategory";
import { Tenant, Category } from "../../src/types/Tenant";
import { ddbDocClient } from "./dbConnection";
import { dbgetTenantinfo, dbgetCategories, dbgetDefaultLanguage } from "./dbTenant";
import { TextCategoryInfo } from "../../src/types/TextCategoryinfo";
import { dbGetTexts, dbgetSingleText } from "./dbTextCategoryGet";



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
    try {
        const txt = await (await ddbDocClient.send(new ScanCommand(param1))).Items as TextCategory[];
        const meta = await (await ddbDocClient.send(new ScanCommand(param2))).Items as TextCategoryInfo[];

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

const updateText = async (tenantID: string, language: string, category: string, title: string, state: state, feedback: string | null) => {
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

    let paramsinfo: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryInfoTable.tableName,
        Key: {
            idTenant: tenantID,
            language_category_title: "<" + language + "&" + category + "'" + title + ">",
        },
        UpdateExpression: "set #feedback = :f",
        ExpressionAttributeValues: {
            ":f": feedback,
        },
        ExpressionAttributeNames: {
            "#feedback": "feedback",
        },
    };
    try {
        await ddbDocClient.send(new UpdateCommand(params));
        if (feedback !== null)
            await ddbDocClient.send(new UpdateCommand(paramsinfo));
        let result = await dbgetSingleText(tenantID, language, category, title);
        console.log("Success - GET", result);
        return result;
    } catch (err) {
        console.log("ERROR inside updateText", err.stack);
        throw { err };
    }
}

export { utilMergeMeta, dbgetCategories, dbdeleteText, dbdeleteSingleText, dbdeleteLanguageTexts, dbdeleteCategoryTexts, dbdeleteAllTexts, dbpostOriginalText, dbpostTranslation, dbputTextCategory, dbputOriginalText, dbputTranslation, updateText };
