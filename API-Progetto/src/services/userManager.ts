import { User } from "src/types/User";
import { CognitoISP } from "./cognito";
import { environment } from 'src/environment/environment';

const createUser = async (User: User) => {
    var params = {
        ClientId: environment.cognito.idclient,
        Password: User.password,
        Username: User.email,
        UserAttributes: [
            {
                Name: 'name',
                Value: User.name
            },
            {
                Name: 'custom:surname',
                Value: User.surname
            },
        ],

    };
    try {
        await CognitoISP.signUp(params).promise();
        // WAIT PERMISSION FROM ZERO12
        //await CognitoISP.adminConfirmSignUp({
        //    UserPoolId: environment.cognito.userPoolId,
        //    Username: params.Username
        //}).promise();
        await CognitoISP.adminAddUserToGroup({
            GroupName: User.role.toString(),
            UserPoolId: environment.cognito.userPoolId,
            Username: params.Username
        }).promise();
    } catch (err) {
        console.log(err);
        throw err;
    }
}
const getUserFromToken   = async (token: string) => {
    return await CognitoISP.getUser({
        AccessToken: token
    }).promise();
}
const AdminGetUser = async (username: string) => {
    return await CognitoISP.adminGetUser({
        UserPoolId: environment.cognito.userPoolId,
        Username: username
    }).promise();
}
const getListUserCognito = async () => {
    try {
        const params = {
            UserPoolId: "eu-west-2_9aZw6rRCn"
        };

        console.log('params', JSON.stringify(params));

        const listUserResp = await getAllUserCognito(params);

        console.log('listUserResp', JSON.stringify(listUserResp));

        return listUserResp.Users;
    } catch (error) {
        return null;
    }
};

const getAllUserCognito = async (params) => {
    try {
        // string must not be empty
        let paginationToken = 'notEmpty';
        let itemsAll = {
            Users: []
        };
        while (paginationToken) {
            const data = await CognitoISP
                .listUsers(params)
                .promise();

            const { Users } = data;
            itemsAll = {
                ...data,
                ...{ Users: [...itemsAll.Users, ...(Users ? [...Users] : [])] }
            };
            paginationToken = data.PaginationToken;
            if (paginationToken) {
                params.PaginationToken = paginationToken;
            }
        }
        return itemsAll;
    } catch (err) {
        console.error(
            'Unable to scan the cognito pool users. Error JSON:',
            JSON.stringify(err, null, 2)
        );
    }
};
export { createUser, getListUserCognito, getUserFromToken, AdminGetUser};
