import { GetCommand, GetCommandInput, ScanCommand, ScanCommandInput, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from "../../src/environment/environment";
import { Text } from "../../src/types/Text";

import { TextCategory, state } from "../../src/types/TextCategory";
import { Tenant, Category } from "../../src/types/Tenant";
import { ddbDocClient } from "./dbConnection";
import { dbgetTenantinfo, dbgetCategories, dbgetDefaultLanguage } from "./dbTenant";
import { TextCategoryInfo } from "../../src/types/TextCategoryinfo";
import { dbdeleteSingleText, utilMergeMeta } from "./dbTextCategory";
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
            FilterExpression: "#idTenant = :t and contains(#language_category_title, :ct)",
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

export { dbgetAllTexts, dbgetTexts, dbgetSingleText, dbgetTranslationsLanguages, dbgetCategoryLanguages, dbGetTexts, textsOfState, };