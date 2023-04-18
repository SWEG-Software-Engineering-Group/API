import { PutCommand, ScanCommand, ScanCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from 'src/environment/environment';
import { state } from "src/types/TextCategory";
import { TextCategory } from "src/types/TextCategory";
import { ddbDocClient } from "./dbConnection";
import { dbgetDefaultLanguage } from "./dbTenant";

//ottieni i testi in base alla specificita della richiesta
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
        "#attributename": "languageidCategorytextId",
    };
    params["ExpressionAttributeValues"] =
    {
        ':begin': language + "#" + ((category == null) ? "" : (category + "#" + (id == null) ? "" : id))
    };
    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Success - GET", data);
        if (!data.Items) return [];
        return data.Items as TextCategory[];
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
}

const dbgetCategories = async (tenantID: string) => {
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
    params["AttributesToGet"] = ['languageidCategorytextId'];

    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Success - GET", data);
        if (!data.Items) return [];

        //filtra qui gli oggetti rimuovendo i duplicati
        var text: TextCategory[] = data.Items as TextCategory[];
        var values: string[] = [];

        text.forEach((val) => {
            var current = val["languageidCategorytextId"].split["#"][1];
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

const textsOfState = async (tenantID: string, language: string, state: state) => {
    var params: ScanCommandInput = { TableName: environment.dynamo.TextCategoryTable.tableName, };
    params["Key"] = {
        idTenant: tenantID,
    }
    params["FilterExpression"] = "stato=:stato AND begins_with(#attributename, :begin)";
    params["ExpressionAttributeNames"] =
    {
        "#attributename": "languageidCategorytextId",
    };
    params["ExpressionAttributeValues"] =
    {
        ':begin': language + "#",
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
const updateText = async (tenantID: string, language: string, category: string, id: string, state: state) => {

    var params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenantID,
            languageidCategorytextId: language + "#" + category + "#" + id
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


export { dbGetTexts, dbgetCategories, textsOfState, updateText };