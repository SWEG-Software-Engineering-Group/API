import { PutCommand, PutCommandInput, ScanCommand, ScanCommandInput, GetCommand, GetCommandInput, DeleteCommand, DeleteCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environment/environment";
import { Tenant, Category } from "src/types/Tenant";
import { v4 as uuidv4 } from "uuid";
import { cgAdminGetUser } from "./userManager";
var crypto = require('crypto');
import { ddbDocClient } from "./dbConnection";
import { dbgetCategoryLanguages } from "./dbTextCategory";

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
        let tenant = data.Item as Tenant;
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

//___________GET____________
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
        throw { "Error:": err.stack };
    }
};
const dbgetUserTenant = async (username: string) => {
    // Set the parameters.
    // CHECK IF USER IS IN FIELD USERS OR ADMINS
    const params: ScanCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        FilterExpression: "contains(#users, :username) OR contains(#admins, :username)",
        ExpressionAttributeNames: {
            "#users": "users",
            "#admins": "admins"
        },
        ExpressionAttributeValues: {
            ":username": username
        }
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
const dbgetTenantUsers = async (tenant: string, usertype: string) => {
    // Check if tenant exists
    let tnt = await dbgetTenantinfo(tenant);
    if (!tnt) {
        throw { err: "Tenant not found" };
    }
    // Get User info from cognito userpool
    try {
        let users = [];
        if (usertype == "content") {
            users = await Promise.all(tnt.users.map(async (user) => {
                return await cgAdminGetUser(user);
            }));
            console.log("Success - GET", users);
            return users;
        } else if (usertype == "admin") {
            users = await Promise.all(tnt.admins.map(async (admin) => {
                return await cgAdminGetUser(admin);
            }));
        }
        console.log("Success - GET", users);
        return users;
    } catch (err) {
        console.log("DB Error", err.stack);
        throw { "DB Error:": err.stack };
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
const dbgetSecondaryLanguages = async (tenant: string) => {
    // Set the parameters.
    let ten: Tenant = await dbgetTenantinfo(tenant);
    if (ten == null) {
        return { err: "Tenant not found" };
    }
    return ten.languages;

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

const dbgetCountLanguagesForCategory = async (tenant: string) => {
    //GET the categories stats of a Tenant
    //input: tenant(String)
    //output: [] / Error
    //{  example
    //    footer: {
    //        id: nasjdhua8sda
    //        languages: {
    //            english: 20,
    //            french: 15,
    //            italian: 7,
    //        }
    //    }
    //}
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        let ten = (await ddbDocClient.send(new GetCommand(params))).Item as Tenant;
        if (ten == null)
            throw { err: "Tenant not found" };

        let res = [];
        ten.categories.forEach(function (cat) {
            res[cat.name] = {
                id: cat.id,
                languages: dbgetCategoryLanguages(tenant, cat.id),
            };
        });

        return res;
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

//___________PUT____________
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
};

//__________UPDATE__________

const dbAddCategoryToTenant = async (tenant: string, category: string) => {
    //UPDATE the tenant by inserting a new category.
    //input: tenant(String), category(string)
    //output: true / Error
    try {
        let categories = await (await dbgetCategories(tenant));
        //this fails when the tenant is empty in the begining
        //if (categories == null)
        //    throw { "error": "tenant has no categories" };
        let cat = categories.find(element => { return element.name === category });
        if (cat !== undefined) {
            return cat.id;
        }
        let newCat = { id: crypto.randomUUID(), name: category } as Category;
        categories.push(newCat);
        const params: UpdateCommandInput = {
            TableName: environment.dynamo.TenantTable.tableName,
            Key: {
                id: tenant,
            },
            UpdateExpression: "set categories = :c",
            ExpressionAttributeValues: {
                ":c": categories,
            },
        };
        await ddbDocClient.send(new UpdateCommand(params));
        return newCat.id;
    } catch (err) {
        throw { "Error": "errore nel db per la funzione dbAddCategoryToTenant", "err2": err };
    }
};
const dbRemoveCategoryFromTenant = async (tenant: string, category: string) => {
    //UPDATE the category name of one category inside the list in a Tenant. if it is not present then add it
    //input: tenant(String), category(string)
    //output: true / Error
    let categories = (await dbgetTenantinfo(tenant)).categories;
    let index = categories.findIndex(element => element.id === category);
    if (index === -1)
        throw { "error": "error" };
    else
        categories.splice(index, 1);
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: {
            idTenant: tenant,
        },
        UpdateExpression: "set categories = :c",
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
const dbAddSecLanguageToTenant = async (tenant: string, language: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:": "Tenant not found" };
    }
    // CHECK IF THE LANGUAGE IS ALREADY IN THE TENANT
    if (tenantInfo.languages.includes(language)) {
        throw { "Error:": "Language already in tenant" };
    }
    if (tenantInfo.defaultLanguage === language) {
        throw { "Error:": "Language equal to default language" };
    }
    // Set the parameters.
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
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
        return "Language successfully added to tenant";
    } catch (err) {
        console.log("Error", err.stack);
        throw { "Error:": err.stack };
    }
};
const dbRemoveSecLanguageFromTenant = async (tenant: string, language: string) => {
    // Check if the tenant exists
    const tenantInfo = await dbgetTenantinfo(tenant);
    if (!tenantInfo) {
        throw { "Error:": "Tenant not found" };
    }
    // Check if the language exists in the tenant othwerwise return error
    if (!tenantInfo.languages.includes(language)) {
        throw { "Error:": "Language not found in tenant" };
    }
    let idx = tenantInfo.languages.indexOf(language);
    console.log("L'indice della lingua è ", idx);
    // Set the parameters.
    // Remove the language in the list with the index idx
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
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
        throw { "Error:": err.stack };
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
    let idx = 0;
    const params: UpdateCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
        UpdateExpression: "REMOVE #users[" + idx + "]",
        ExpressionAttributeNames: {
            "#users": "users",
        },
        ReturnValues: "UPDATED_NEW"
    };
    // Check if the user exists in the tenant othwerwise return error
    if (tenantInfo.users.includes(username)) {
        idx = tenantInfo.users.indexOf(username);
        params.UpdateExpression = "REMOVE #users[" + idx + "]";
        console.log("L'indice dell'utente è ", idx);
    } else if (tenantInfo.admins.includes(username)) {
        idx = tenantInfo.admins.indexOf(username);
        params.UpdateExpression = "REMOVE #admins[" + idx + "]";
        params.ExpressionAttributeNames["#admins"] = "admins";
        console.log("L'indice dell'admin è ", idx);
    } else {
        throw { "DB Error:": "User not found in tenant" };
    }
    // Set the parameters.
    // Remove the user in the list with the given index
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

export { dbgetTenantinfo, dbcheckAdminInTenant, dbcheckUserInTenant, dbgetTenants, dbgetUserTenant, dbgetTenantUsers, dbputTenant, dbgetCategories, dbgetCountLanguagesForCategory, dbdeleteTenant, dbresetTenant, dbAddUserToTenant, dbRemoveUserFromTenant, dbAddAdminToTenant, dbgetDefaultLanguage, dbgetSecondaryLanguages, dbAddCategoryToTenant, dbRemoveCategoryFromTenant, dbAddSecLanguageToTenant, dbRemoveSecLanguageFromTenant };