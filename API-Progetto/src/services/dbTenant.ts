import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
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

export { dbputTenant, dbgetTenant };