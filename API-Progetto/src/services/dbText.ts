import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { Text } from "src/types/Text";
import { TextCategory } from "src/types/TextCategory";
import { ddbDocClient } from "./dbConnection";

const dbgetCategory = async (tenant: string, name: string) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            idGruppo: name
        },
    };
    try {
        const category = await ddbDocClient.send(new GetCommand(params));

        
        return category.Item as TextCategory;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetLanguage = async (tenant: string, name: string) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            idGruppo: name
        },
    };
    try {
        const category = await ddbDocClient.send(new GetCommand(params));

        
        return category.Item as TextCategory;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetText = async (tenant: string, name: string) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            idGruppo: name
        },
    };
    try {
        const category = await ddbDocClient.send(new GetCommand(params));

        
        return category.Item as TextCategory;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};
const dbgetAllTexts = async (tenant: string, name: string) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            idGruppo: name
        },
    };
    try {
        const category = await ddbDocClient.send(new GetCommand(params));

        
        return category.Item as TextCategory;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};
export { dbgetCategory, dbgetLanguage, dbgetText,dbgetAllTexts };