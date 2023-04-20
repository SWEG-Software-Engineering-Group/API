import { PutCommand, PutCommandInput, ScanCommand, ScanCommandInput, GetCommand, GetCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environment/environment";
import { Tenant, Category } from "src/types/Tenant";
import { v4 as uuidv4 } from "uuid";
import { ddbDocClient } from "./dbConnection";

//UTIL
const dbcheckUserInTenant = async (tenant: string, user: string) => {
    //check if the user is listed inside this Tenant as ContentUser
    //input: tenant(String), user(String)
    //output: True / False / Error
    const params: GetCommandInput = {
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
        throw { err };
    }
};

const dbcheckAdminInTenant = async (tenant: string, user: string) => {
    //check if the user is listed inside this Tenant as Admin
    //input: tenant(String), user(String)
    //output: True / False / Error
    const params: GetCommandInput = {
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
        throw { err };
    }
};

//__________GET__________
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
        throw { "Error:": err.stack };
    }
};

const dbgetDefaultLanguage = async (tenant: string) => {
    // Get Tenant default language
    if (!await dbgetTenantinfo(tenant)) {
        throw { err: "Tenant not found" };
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
        throw { "Error": err.stack };
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

        return tenant.Item.languages as Array<String>;
    } catch (err) {
        throw { err };
    }
};

const dbgetCategories = async (tenant: string) => {
    //GET the categories list inside a Tenant
    //input: tenant(String)
    //output: Category[] / Error
    if (!await dbgetTenantinfo(tenant)) {
        throw { err: "Tenant not found" };
    }
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        let ten = (await ddbDocClient.send(new GetCommand(params))).Item as Tenant;
        return ten.categories as Category[];
    } catch (err) {
        throw { err };
    }
};

//__________DELETE__________
const dbdeleteTenant = async (tenant: string) => {
    // Set the parameters.
    if (!await dbgetTenantinfo(tenant)) {
        return { err: "Tenant not found" };
    }
    const params: DeleteCommandInput = {
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

const dbdeleteLanguage = async (tenant: string, language: string) => {
    //UPDATE the language list inside a Tenant by removing one
    //input: tenant(String), language(string)
    //output: true / Error
    let languages: Array<String> = await (dbgetSecondaryLanguage(tenant));
    const index = languages.indexOf(language, 0);
    if (index > -1) {
        languages.splice(index, 1);
    }
    const params = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
        },
        UpdateExpression: "set languages = {:l}",
        ExpressionAttributeValues: {
            ":l": languages,
        },
    };
    try {
        await ddbDocClient.send(new UpdateCommand(params));
        return true;
    } catch (err) {
        throw { err };
    }
};

//__________PUT__________
const dbputTenant = async (tenant: Tenant) => {
    const tenantparams: PutCommandInput = {
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

//__________UPDATE__________
const dbresetTenant = async (tenant: string) => {
    if (!await dbgetTenantinfo(tenant)) {
        return { err: "Tenant not found" };
    }
    try {
        const params: UpdateCommandInput = {
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

const dbAddUserToTenant = async (tenant: string, username: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:": "Tenant not found" };
    }
    // CHECK IF THE USER IS ALREADY IN THE TENANT
    if (tenantInfo.users.includes(username)) {
        throw { "Error:": "User already in tenant" };
    }
    // Set the parameters.
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
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
        throw { "Error:": err.stack };
    }
};

const dbRemoveUserFromTenant = async (tenant: string, username: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:": "Tenant not found" };
    }
    // Check if the user exists in the tenant othwerwise return error
    if (!tenantInfo.users.includes(username)) {
        throw { "Error:": "User not found in tenant" };
    }
    let idx = tenantInfo.users.indexOf(username);
    console.log("L'indice dell'utente è ", idx);
    // Set the parameters.
    // Remove the user in the list with the given index
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
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
        throw { "Error:": err.stack };
    }
};

const dbAddAdminToTenant = async (tenant: string, username: string) => {
    // Check if tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:": "Tenant not found" };
    }
    // CHECK IF THE ADMIN IS ALREADY IN THE TENANT
    if (tenantInfo.users.includes(username)) {
        throw { "Error:": "Admin already in tenant" };
    }
    // Set the parameters.
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
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
        throw { "Error:": err.stack };
    }
};

const dbRemoveAdminFromTenant = async (tenant: string, username: string) => {

    console.log("TENANT", tenant)
    const tenantInfo = await dbgetTenantinfo(tenant);
    console.log("TENANT INFO", tenantInfo)
    // Check if tenant exists
    if (!tenantInfo) {
        throw { "Error:": "Tenant not found" };
    }
    // Check if the user exists in the tenant othwerwise return error
    if (!tenantInfo.admins.includes(username)) {
        throw { "Error:": "User is not an admin of the tenant" };
    }
    let idx = tenantInfo.admins.indexOf(username);
    // Set the parameters.
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
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
        throw { "Error:": err.stack };
    }
};

const dbputCategory = async (tenant: string, category: string, name: string) => {
    //UPDATE the category name of one category inside the list in a Tenant. if it is not present then add it
    //input: tenant(String), category(string)
    //output: true / Error
    let categories = (await dbgetTenantinfo(tenant)).categories;
    let index = categories.findIndex(element => element.id === category);
    if (index === -1)
        throw {"error":"error"};
    else
        categories[index].name = name;
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TextCategoryTable.tableName,
        Key: {
            idTenant: tenant,
        },
        UpdateExpression: "set categories = {:c}",
        ExpressionAttributeValues: {
            ":c": categories,
        },
    };
    try {
        await ddbDocClient.send(new UpdateCommand(params));
        return true;
    } catch (err) {
        throw { err };
    }
};

const dbaddCategory = async (tenant: string, category: string) => {
    //UPDATE the tenant by inserting a new category.
    //input: tenant(String), category(string)
    //output: true / Error
    try {
        let categories = await dbgetCategories(tenant);
        if (categories === undefined)
            throw { "error": "perchè undefined???????" };
        //let tenantInfo = await dbgetTenantinfo(tenant);
    //if (tenantInfo === undefined)
    //    throw { "error": "perchè undefined???????" };
    //if (tenantInfo.categories === undefined)
    //    throw { "error": "category not found" };
    //let categories = tenantInfo.categories;
    //if (categories === undefined)
    //    throw { "error": "category undefined" };

        let index = categories.findIndex(element => element.id === category);
        if (index !== -1)
            throw { "error": "error" };
        categories.push({ id: uuidv4, name: category });
        const params: UpdateCommandInput = {
            TableName: environment.dynamo.TextCategoryTable.tableName,
            Key: {
                idTenant: tenant,
            },
            UpdateExpression: "set categories = {:c}",
            ExpressionAttributeValues: {
                ":c": categories,
            },
        };
        
            await ddbDocClient.send(new UpdateCommand(params));
            return true;
    } catch (err) {
        throw { err };
    }
};


export { dbcheckUserInTenant, dbcheckAdminInTenant, dbputTenant, dbgetTenants, dbdeleteTenant, dbresetTenant, dbAddUserToTenant, dbRemoveUserFromTenant, dbAddAdminToTenant, dbRemoveAdminFromTenant, dbgetUserTenant, dbgetTenantinfo, dbgetDefaultLanguage, dbgetSecondaryLanguage, dbgetCategories, dbdeleteLanguage, dbputCategory, dbaddCategory };