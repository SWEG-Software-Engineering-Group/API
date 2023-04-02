import { PutCommand, GetCommand, GetCommandInput, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { Tenant } from "src/types/Tenant";
import { ddbDocClient } from "./dbConnection";

const dbcheckUserInTenant = async (tenant: string, user: string) => {
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { name: tenant },
    };
    try {
        const data = await ddbDocClient.send(new GetCommand(params));
        let tenant= data.Item as Tenant;
        if (tenant.users.includes(user) || tenant.admins.includes(user))
            return true;
        return false;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbcheckAdminInTenant = async (tenant: string, user: string) => {
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { name: tenant },
    };
    try {
        const data = await ddbDocClient.send(new GetCommand(params));
        let tenant = data.Item as Tenant;
        if (tenant.admins.includes(user))
            return true;
        return false;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbputTenant = async (tenant: Tenant) => {
    const tenantparams = {
        TableName: environment.dynamo.TenantTable.tableName,
        Item: tenant,
    };
    try {
        const data = await ddbDocClient.send(new PutCommand(tenantparams));
        console.log("Success - item added or updated", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw err;
    }
}

const dbgetTenant = async (tenant: string) => {
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { name: tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));

        console.log("Success - GET", tenant);
        return tenant.Item as Tenant;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetTenantinfo = async (tenant: string) => {
    // Set the parameters.
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));

        console.log("Success - GET", tenant);
        return tenant.Item as Tenant;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetDefaultLanguage = async (tenant: string) => {
    // Set the parameters.
    if (!await dbgetTenantinfo(tenant)) {
        return { err: "Tenant not found" };
    }
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));

        console.log("Success - GET", tenant);
        return tenant.Item.defaultLanguage as string;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbdeleteLanguage = async (tenant: string, language: string) => {
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
            lingua:language,
        },
    };
    try {
        const data = await ddbDocClient.send(new DeleteCommand(params));
        console.log("Success - GET", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, language };
    }
};

export { dbcheckUserInTenant, dbcheckAdminInTenant, dbputTenant, dbgetTenant, dbgetDefaultLanguage, dbdeleteLanguage };