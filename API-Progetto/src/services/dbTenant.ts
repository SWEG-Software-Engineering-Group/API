import { PutCommand, ScanCommand, ScanCommandInput, GetCommand, GetCommandInput, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environment/environment";
import { Tenant } from "src/types/Tenant";
import { ddbDocClient } from "./dbConnection";

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

const dbgetTenants = async () => {
    const tenantparams: ScanCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
    };
    try {  
        const tenant = await ddbDocClient.send(new ScanCommand(tenantparams));
        console.log("Success - item added or updated", tenant);
        return  {
            tenants: tenant.Items.sort((a: Tenant, b: Tenant) => a.tenantName.localeCompare(b.tenantName))
        }
    } catch (err) {
        console.log("Error", err.stack);
        throw err;
    }   
}

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
    if (!await dbgetTenantinfo(tenant)){
        return { err: "Tenant not found" };
    }
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));
        
        console.log("Success - GET", tenant);
        return tenant.Item.defaultLanguage as Tenant;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetSecondaryLanguage = async (tenant: string) => {
    // Set the parameters.
    if (!await dbgetTenantinfo(tenant)){
        return { err: "Tenant not found" };
    }
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));
        
        console.log("Success - GET", tenant);
        return tenant.Item.languages;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbdeleteTenant = async (tenant: string) => {
    // Set the parameters.
    if (!await dbgetTenantinfo(tenant)){
        return { err: "Tenant not found" };
    }
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        const data = await ddbDocClient.send(new DeleteCommand(params));
        console.log("Success - GET", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw { err, tenant };
    }
};

const dbresetTenant = async (tenant: string) => {
    if (!await dbgetTenantinfo(tenant)){
        return { err: "Tenant not found" };
    }
    try {
        const params = {
            TableName: environment.dynamo.TenantTable.tableName,
            Key: {
                id: tenant
            },
            UpdateExpression: "SET #tenantName = :tenantName,#admins = :admins,#users = :users,#creationDate = :creationDate,#languages = :languages,#defaultLanguage = :defaultLanguage",
            ExpressionAttributeNames: {
                "#tenantName": "tenantName",
                "#admins": "admins",
                "#users": "users",
                "#creationDate": "creationDate",
                "#languages": "languages",
                "#defaultLanguage": "defaultLanguage",
            },
            ExpressionAttributeValues: {
                ":tenantName": "",
                ":admins": [],
                ":users": [],
                ":creationDate": 0,
                ":languages": [],
                ":defaultLanguage": "",
            },
            ReturnValues: "UPDATED_NEW"
        };
        await ddbDocClient.send(new UpdateCommand(params));
        return "Tenant updated";
    } catch (error) {
        return { "error": error };
    }
};
export { dbputTenant, dbgetTenants, dbgetTenantinfo, dbgetDefaultLanguage, dbgetSecondaryLanguage, dbdeleteTenant, dbresetTenant };