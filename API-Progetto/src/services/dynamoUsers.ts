import {
    DeleteCommand,
    GetCommand,
    GetCommandInput,
    PutCommand,
    ScanCommand,
    ScanCommandInput,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environement/environement";
import { User } from "src/types/User";
import { ddbDocClient } from "./dbConnection";

const dbputUser = async (user: User) => {
    const params = {
        TableName: environment.dynamo.UserTable.tableName,
        Item: user,
    };
    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - item added or updated", data);
    } catch (err) {
        console.log("Error", err.stack);
        throw err;
    }
}
export {
    dbputUser
}