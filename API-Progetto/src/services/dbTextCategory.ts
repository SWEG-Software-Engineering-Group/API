import { PutCommand, ScanCommand, ScanCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { state } from "src/types/Text";
import { TextCategory } from "src/types/TextCategory";
import { ddbDocClient } from "./dbConnection";

//ottieni i testi in base alla specificita della richiesta
const dbGetTexts = async (tenantID: string, language: string = null, category: string = null, id: string = null) => {
    var params: ScanCommandInput = { TableName: environment.dynamo.TextCategoryTable.tableName, };
    //caso lingua = null ritorna la lingua di default
    if (language == null) {

        params["FilterExpression"] = "#isDefault = :isDefault AND #idTenant = :idTenant";
        params["ExpressionAttributeNames"] =
        {
            "#isDefault": "isDefault",
            "#idTenant": "idTenant"
        };
        params["ExpressionAttributeValues"] =
        {
            ':isDefault': true,
            ':idTenant': tenantID
        };
    }
    //caso lingua non nulla
    else {
        params["FilterExpression"] = "#idTenant = :idTenant AND begins_with(#attributename, :begin)";
        params["ExpressionAttributeNames"] =
        {
            "#attributename": "languageidCategorytextId",
            "#idTenant": "idTenant"
        };
        params["ExpressionAttributeValues"] =
        {
            ':idTenant': tenantID,
            ':begin': language + "#" + ((category == null) ? "" : (category + "#" + (id == null) ? "" : id))
        };
    }

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
    params["FilterExpression"] = "#isDefault = :isDefault AND #idTenant = :idTenant";
    params["ExpressionAttributeNames"] =
    {
        "#isDefault": "isDefault",
        "#idTenant": "idTenant"
    };
    params["ExpressionAttributeValues"] =
    {
        ':isDefault': true,
        ':idTenant': tenantID
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
    params["FilterExpression"] = "txt.stato=:stato and #idTenant = :idTenant AND begins_with(#attributename, :begin)";
    params["ExpressionAttributeNames"] =
    {
        "#attributename": "languageidCategorytextId",
        "#idTenant": "idTenant"
    };
    params["ExpressionAttributeValues"] =
    {
        ':idTenant': tenantID,
        ':begin': language + "#",
        ':stato': state
    };

    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Success - GET", data);
        if (!data.Items) return [];

        //filtra qui gli oggetti rimuovendo i duplicati
        var text: TextCategory[] = data.Items as TextCategory[];

        return text.map((e) => e.txt);

    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
}
const updateText = async (tenantID: string, language: string, category: string, id: string, state: state) => {
    var text: TextCategory[] = (await dbGetTexts(tenantID, language, category, id));
    if (text.length == 0) {
        throw "text does not exist";
    }
    var toupdate: TextCategory = text[0];

    toupdate.txt.stato = state;
    var params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenantID,
            languageidCategorytextId: language + "#" + category + "#" + id
        }
    };
    params["UpdateExpression"] = "SET #text = :udpated";
    params["ExpressionAttributeNames"] =
    {
        "#text": "text",
    };
    params["ExpressionAttributeValues"] =
    {
        ":udpated": toupdate.txt,
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