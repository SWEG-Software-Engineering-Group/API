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
        return {
            tenants: tenant.Items//.sort((a: Tenant, b: Tenant) => a.tenantName.localeCompare(b.tenantName))
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
        Key: { id : tenant },
    };
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));
        console.log("Success - GET", tenant);
        return tenant.Item as Tenant;
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbAddCategoryToTenant = async (tenant: string, category: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // CHECK IF THE CATEGORY IS ALREADY IN THE TENANT
    if (tenantInfo.categories.includes(category)) {
        throw { "Error:" : "Category already in tenant" };
    }
    // Set the parameters.
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "SET #categories = list_append(#categories, :category)",  
        ExpressionAttributeNames: {
            "#categories": "categories",
        },
        ExpressionAttributeValues: {
            ":category": [category],
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Add category to tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbRemoveCategoryFromTenant = async (tenant: string, category: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // CHECK IF THE CATEGORY IS ALREADY IN THE TENANT
    if (!tenantInfo.categories.includes(category)) {
        throw { "Error:" : "Category not in tenant" };
    }
    let idx = tenantInfo.categories.indexOf(category);
    // Set the parameters.
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "REMOVE #categories[" + idx + "]",
        ExpressionAttributeNames: {
            "#categories": "categories",
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Remove category from tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbAddSecLanguageToTenant = async (tenant: string, language: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // CHECK IF THE LANGUAGE IS ALREADY IN THE TENANT
    if (tenantInfo.languages.includes(language)) {
        throw { "Error:" : "Language already in tenant" };
    }
    // Set the parameters.
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "SET #languages = list_append(#languages, :language)",
        ExpressionAttributeNames: {
            "#languages": "languages",
        },
        ExpressionAttributeValues: {
            ":language": [language],
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Add language to tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbRemoveSecLanguageFromTenant = async (tenant: string, language: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // Check if the language exists in the tenant othwerwise return error
    if (!tenantInfo.languages.includes(language)) {
        throw { "Error:" : "Language not found in tenant" };
    }
    let idx = tenantInfo.languages.indexOf(language);
    console.log("L'indice della lingua è ", idx);
    // Set the parameters.
    // Remove the language in the list with the index idx
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "REMOVE #languages[" + idx + "]",
        ExpressionAttributeNames: {
            "#languages": "languages",
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Remove language from tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbAddUserToTenant = async (tenant: string, username: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // CHECK IF THE USER IS ALREADY IN THE TENANT
    if (tenantInfo.users.includes(username)) {
        throw { "Error:" : "User already in tenant" };
    }
    // Set the parameters.
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "SET #users = list_append(#users, :username)",
        ExpressionAttributeNames: {
            "#users": "users",
        },
        ExpressionAttributeValues: {
            ":username": [username],
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Add user to tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbRemoveUserFromTenant = async (tenant: string, username: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // Check if the user exists in the tenant othwerwise return error
    if (!tenantInfo.users.includes(username)) {
        throw { "Error:" : "User not found in tenant" };
    }
    let idx = tenantInfo.users.indexOf(username);
    console.log("L'indice dell'utente è ", idx);
    // Set the parameters.
    // Remove the user in the list with the given index
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "REMOVE #users[" + idx + "]",
        ExpressionAttributeNames: {
            "#users": "users",
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Remove user from tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbAddAdminToTenant = async (tenant: string, username: string) => {
    // Check if tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // CHECK IF THE ADMIN IS ALREADY IN THE TENANT
    if (tenantInfo.users.includes(username)) {
        throw { "Error:" : "Admin already in tenant" };
    }
    // Set the parameters.
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "SET #admins = list_append(#admins, :username)",
        ExpressionAttributeNames: {
            "#admins": "admins",
        },
        ExpressionAttributeValues: {
            ":username": [username],
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Add admin to tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbRemoveAdminFromTenant = async (tenant: string, username: string) => {

    console.log("TENANT", tenant)
    const tenantInfo = await dbgetTenantinfo(tenant);
    console.log("TENANT INFO", tenantInfo)
    // Check if tenant exists
    if (!tenantInfo) {
        throw { "Error:" : "Tenant not found" };
    }
    // Check if the user exists in the tenant othwerwise return error
    if (!tenantInfo.admins.includes(username)) {
        throw { "Error:" : "User is not an admin of the tenant" };
    }
    let idx = tenantInfo.admins.indexOf(username);
    // Set the parameters.
    const params = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id : tenant },
        UpdateExpression: "REMOVE #admins[" + idx + "]",
        ExpressionAttributeNames: {
            "#admins": "admins",
        },
        ReturnValues: "UPDATED_NEW"
    };
    try {
        const tenant = await ddbDocClient.send(new UpdateCommand(params));
        console.log("Success - GET", tenant);
        return "Remove admin from tenant success";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbgetUserTenant = async (username: string) => {
    // Set the parameters.
    const params: ScanCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        FilterExpression: "contains(#users, :username)",
        ExpressionAttributeNames: {
            "#users": "users",
        },
        ExpressionAttributeValues: {
            ":username": username,
        },
    };
    try {
        const tenant = await ddbDocClient.send(new ScanCommand(params));

        console.log("Success - GET", tenant);
        return tenant.Items as Tenant[];
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:" : err.stack };
    }
};
const dbgetDefaultLanguage = async (tenant: string) => {
    // Get Tenant default language
    if (!await dbgetTenantinfo(tenant)) {
        throw { err: "Tenant not found"};
    }
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant }
    }
    try {
        const tenant = await ddbDocClient.send(new GetCommand(params));
        console.log("Success - GET", tenant);
        return tenant.Item.defaultLanguage;
    } catch (err) {
        console.log("Error", err.stack);
        throw {"Error" : err.stack};
    }
};
const dbgetSecondaryLanguage = async (tenant: string) => {
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
        return tenant.Item.languages;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};
const dbdeleteTenant = async (tenant: string) => {
    // Set the parameters.
    if (!await dbgetTenantinfo(tenant)) {
        return { err: "Tenant not found" };
    }
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        await ddbDocClient.send(new DeleteCommand(params));
        return "Tenant deleted";
    } catch (err) {
        throw { "error": err };
    }
};
const dbresetTenant = async (tenant: string) => {
    if (!await dbgetTenantinfo(tenant)) {
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
export { dbAddCategoryToTenant, dbRemoveCategoryFromTenant,dbAddSecLanguageToTenant,dbRemoveSecLanguageFromTenant,dbputTenant, dbgetTenants, dbgetTenantinfo, dbgetDefaultLanguage, dbgetSecondaryLanguage, dbdeleteTenant, dbresetTenant, dbgetUserTenant, dbAddUserToTenant, dbAddAdminToTenant, dbRemoveAdminFromTenant, dbRemoveUserFromTenant };