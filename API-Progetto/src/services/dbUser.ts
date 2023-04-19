import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { environment } from "src/environment/environment";
import { User } from "src/types/User";
import { ddbDocClient } from "./dbConnection";

const dbgetUser = async (user: string) => {
    const params = {
        TableName: environment.dynamo.UserTable.tableName,
        Key: { name: user },
    };
    try {
        const user = await ddbDocClient.send(new GetCommand(params));

        console.log("Success - GET", user);
        return user.Item as User;
    } catch (err) {
        console.log("Error", err.stack);
        throw { err };
    }
};

export { dbgetUser };