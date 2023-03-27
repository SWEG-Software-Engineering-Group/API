import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { Tenant } from "src/types/Tenant";
import { ddbDocClient } from "./dbConnection";

const checkUserInTenant = async (tenant: string, user: string) => {
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { name: tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));
        if (tenant.users.includes(user) || tenant.admins.includes(user))
            return true;
        return false;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const checkAdminInTenant = async (tenant: string, user: string) => {
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { name: tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));
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

export { checkUserInTenant, checkAdminInTenant, dbputTenant, dbgetTenant };