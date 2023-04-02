import { GetCommand , DeleteCommand, UpdateCommand, PutCommand} from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { TextCategory } from "src/types/TextCategory";
import { state, Text } from "src/types/Text";
import { ddbDocClient } from "./dbConnection";

const dbgetAllTexts = async (tenant: string) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant
        },
    };
    try {
        const category = await ddbDocClient.send(new GetCommand(params));
        console.log("Success - GET");
        return category.Item as TextCategory[];
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

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

        console.log("Success - GET");
        return category.Item as TextCategory[];
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetLanguage = async (tenant: string, name: string, state: state) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            lingua: name,
            stato: state
        },
    };
    try {
        const category = await ddbDocClient.send(new GetCommand(params));

        console.log("Success - GET");
        return category.Item as TextCategory[];
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetTexts = async (tenant: string, language: string, category: string) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            idGruppo: category,
            lingua: language,
        },
    };
    try {
        const texts = await ddbDocClient.send(new GetCommand(params));

        console.log("Success - GET");
        return texts.Item as Text[];
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbdeleteText = async (tenant: string, text: string) => {
    const params = {
        TableName: environment.dynamo.Text.tableName,
        Key: {
            idTenant: tenant,
            id: text,
        },
    };
    try {
        const data = await ddbDocClient.send(new DeleteCommand(params));
        console.log("Success - DELETE", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, text };
    }
};

const dbpostOriginalText = async (tenant: string, text: string, category: string) => {
    const params = {
        TableName: environment.dynamo.TextTable.tableName,
        Key: {
            idTenant: tenant,
            id: text,
        },
    };
    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - PUT", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, text };
    }
};

const dbpostTranslation = async (tenant: string, text: string, category: string, language: string) => {
    const params = {
        TableName: environment.dynamo.TextTable.tableName,
        Key: {
            idTenant: tenant,
            id: text,
        },
    };
    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - PUT", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, text };
    }
};

const dbputCategory = async (tenant: string, category: string, name: string) => {
    const params = {
        TableName: environment.dynamo.TextTable.tableName,
        Key: {
            idTenant: tenant,
            id: text,
        },
    };
    try {
        const data = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - UPDATE", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, text };
    }
};

const dbputOriginalText = async (tenant: string, text: string, category: string, newtext: string) => {
    const params = {
        TableName: environment.dynamo.TextTable.tableName,
        Key: {
            idTenant: tenant,
            id: text,
        },
    };
    try {
        const data = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - UPDATE", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, text };
    }
};

const dbputTranslation = async (tenant: string, text: string, category: string, language: string, newtext: string) => {
    const params = {
        TableName: environment.dynamo.TextTable.tableName,
        Key: {
            idTenant: tenant,
            id: text,
        },
    };
    try {
        const data = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - UPDATE", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, text };
    }
};

export {dbgetAllTexts, dbgetCategory, dbgetLanguage, dbgetTexts, dbdeleteText, dbpostOriginalText, dbpostTranslation, dbputCategory, dbputOriginalText, dbputTranslation };