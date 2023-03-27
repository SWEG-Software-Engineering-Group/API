import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { Tenant } from "src/types/Tenant";
import { environment } from "src/environement/environement";
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

export { dbputTenant };