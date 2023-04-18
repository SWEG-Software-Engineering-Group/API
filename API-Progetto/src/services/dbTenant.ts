import { PutCommand, GetCommand, GetCommandInput, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { Tenant } from "src/types/Tenant";
import { uuid } from "uuid";
import { ddbDocClient } from "./dbConnection";

const dbcheckUserInTenant = async (tenant: string, user: string) => {
    //check if the user is listed inside this Tenant as ContentUser
    //input: tenant(String), user(String)
    //output: True / False / Error
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
        throw { err };
    }
};

const dbcheckAdminInTenant = async (tenant: string, user: string) => {
    //check if the user is listed inside this Tenant as Admin
    //input: tenant(String), user(String)
    //output: True / False / Error
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
        let ten = (await ddbDocClient.send(new GetCommand(params))).Item as Tenant;
        return ten.defaultLanguage;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

const dbgetCategories = async (tenant: string) => {
    //GET the categories list inside a Tenant
    //input: tenant(String)
    //output: Category[] / Error
    const params: GetCommandInput = {
        TableName: environment.dynamo.TenantTable.tableName,
        Key: { id: tenant },
    };
    try {
        let ten = (await ddbDocClient.send(new GetCommand(params))).Item as Tenant;
        return ten.categories;
    } catch (err) {
        throw { err };
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

const dbputCategory = async (tenant: string, category: string, name: string) => {
    //UPDATE the category name of one category inside the list in a Tenant
    //input: tenant(String), category(string)
    //output: true / Error
    let categories = (await dbgetTenantinfo(tenant)).categories;
    let index = categories.findIndex(element => element.id === category);
    if (index === -1)
        categories.push({ id: uuid.v4, name: name});
    else
        categories[index].name=name;
    const params = {
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

export { dbcheckUserInTenant, dbcheckAdminInTenant, dbputTenant, dbgetTenantinfo, dbgetDefaultLanguage, dbgetSecondaryLanguage, dbgetCategories, dbdeleteLanguage, dbputCategory };