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
        
        await CognitoISP.adminConfirmSignUp({
            UserPoolId: environment.cognito.userPoolId,
            Username: params.Username
        }).promise();
        addUserRole(params.Username, User.role);
    } catch (err) {
        console.log(err);
        throw {"Create User:": err};
    }
}
const addUserRole = async (username: string, role: string) => {
    try {
        await CognitoISP.adminAddUserToGroup({
            GroupName: role.toString(),
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        }).promise();
    } catch (error) {
        console.log(error);
        throw{"Add User:": error};
    }
}
const removeUserRole = async (username: string, role: string) => {
    try {
        await CognitoISP.adminRemoveUserFromGroup({
            GroupName: role.toString(),
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        }).promise();
    } catch (error) {
        console.log(error);
        throw{"Remove User:": error};
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
            UserPoolId: environment.cognito.userPoolId
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

const getListUserGroups = async (username : string) => {
    try {
        const params = {
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        };

        console.log('params', JSON.stringify(params));

        const listGroupsResp = await getAllUserGroups(params);

        console.log('listGroupsResp', JSON.stringify(listGroupsResp));

        return listGroupsResp.Groups;
    } catch (error) {
        throw{"List User groups:": error};
    }
};

const getAllUserGroups = async (params) => {
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

const deleteUser = async (username: string) => {
    try {
        const params = {
            UserPoolId: environment.cognito.userPoolId,
            Username: username
        };
        await CognitoISP.adminDeleteUser(params).promise();
    } catch (error) {
        throw {"Delete user": error};
    }
}

export { createUser, getListUserCognito, getUserFromToken, AdminGetUser, deleteUser, addUserRole, removeUserRole, getListUserGroups};
