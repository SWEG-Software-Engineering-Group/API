import { User } from "src/types/User";
import { CognitoISP } from "./cognito";
import { environment } from "../../src/environment/environment";
import { dbgetUserTenant, dbRemoveUserFromTenant } from "./dbTenant";


const cgcreateUser = async (User: User) => {
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

        //await CognitoISP.adminConfirmSignUp({
        //    UserPoolId: environment.cognito.userPoolId,
        //    Username: params.Username
        //}).promise();
        cgaddUserRole(params.Username, User.role);
        return cgAdminGetUser(params.Username);
    } catch (err) {
        console.log(err);
        throw { "Create User:": err };
    }
}
const cgaddUserRole = async (username: string, role: string) => {
    try {
        await CognitoISP.adminAddUserToGroup({
            GroupName: role.toString(),
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        }).promise();
    } catch (error) {
        console.log(error);
        throw { "Add User:": error };
    }
}
const cgremoveUserRole = async (username: string, role: string) => {
    try {
        await CognitoISP.adminRemoveUserFromGroup({
            GroupName: role.toString(),
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        }).promise();
    } catch (error) {
        console.log(error);
        throw { "Remove User:": error };
    }

}
const cggetUserFromToken = async (token: string) => {
    return await CognitoISP.getUser({
        AccessToken: token
    }).promise();
}
const cgAdminGetUser = async (username: string) => {
    return await CognitoISP.adminGetUser({
        UserPoolId: environment.cognito.userPoolId,
        Username: username
    }).promise();
}
const cggetListUserCognito = async () => {
    try {
        const params = {
            UserPoolId: environment.cognito.userPoolId
        };

        console.log('params', JSON.stringify(params));

        const listUserResp = await cggetAllUserCognito(params);

        console.log('listUserResp', JSON.stringify(listUserResp));

        return listUserResp.Users;
    } catch (error) {
        return null;
    }
};

const cggetAllUserCognito = async (params) => {
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

const cggetListUserGroups = async (username: string) => {
    try {
        const params = {
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        };

        console.log('params', JSON.stringify(params));

        const listGroupsResp = await cggetAllUserGroups(params);

        console.log('listGroupsResp', JSON.stringify(listGroupsResp));

        return listGroupsResp.Groups;
    } catch (error) {
        throw { "List User groups:": error };
    }
};

const cggetAllUserGroups = async (params) => {
    try {
        // string must not be empty
        let paginationToken = 'notEmpty';
        let itemsAll = {
            Groups: []
        };
        while (paginationToken) {
            const data = await CognitoISP
                .adminListGroupsForUser(params)
                .promise();

            const { Groups } = data;
            itemsAll = {
                ...data,
                ...{ Groups: [...itemsAll.Groups, ...(Groups ? [...Groups] : [])] }
            };
            paginationToken = data.NextToken;
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

const cgdeleteUser = async (username: string) => {
    try {
        const params = {
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        };
        await CognitoISP.adminDeleteUser(params).promise();
        // REMOVE FROM TENANT
        const tenant = await dbgetUserTenant(username);
        if (tenant) {
            await dbRemoveUserFromTenant(tenant[0].id, username);
        }
    } catch (error) {
        throw { "Delete user": error };
    }
}
const cgsendResetCode = async (username: string) => {
    try {
        const params = {
            ClientId: environment.cognito.idclient,
            Username: username
        };
        await CognitoISP.forgotPassword(params).promise();
        return "Reset code sent"
    } catch (error) {
        throw { "Send reset code": error };
    }
}
const cgresetPassword = async (username: string, code: string, newPassword: string) => {
    try {
        const params = {
            ClientId: environment.cognito.idclient,
            ConfirmationCode: code,
            Password: newPassword,
            Username: username
        };
        await CognitoISP.confirmForgotPassword(params).promise();
        return "Password resetted"
    } catch (error) {
        console.log(error);
        throw { "Reset password": error };
    }
}

export { cgsendResetCode, cgresetPassword, cgcreateUser, cggetListUserCognito, cggetUserFromToken, cgAdminGetUser, cgdeleteUser, cgaddUserRole, cgremoveUserRole, cggetListUserGroups };
