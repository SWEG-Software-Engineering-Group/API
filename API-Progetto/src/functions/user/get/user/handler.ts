import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetUser } from 'src/services/dbUser';
import { dbcheckAdminInTenant } from 'src/services/dbTenant';
import { User } from 'src/types/User';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getUserInfo: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), User (String)
     * OUTPUT:  {response: OK} / Error
     * 
     * DESCRIPTION: returns all the informations of an user inside a Tenant, else return error.
     *      password must be removed from the fields.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (user, admin);
     *  -   check input, sanitize, validate;
     *  -   check user is authorized inside the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized for this function;
     *  -   user is not authorized inside this tenant;
     *  -   input is empty;
     *  -   input is invalid;
     *  -   request to db failed;
     *  -   tenant list of users is empty; 
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.UserId == null)
        return formatJSONResponse({ "error": "no valid input" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    let userName = sanitizeHtml(event.pathParameters.UserId, { allowedTags: [], allowedAttributes: {} })
    if (userName === '' || tenant === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //collect the data from db
        var user: User = await dbgetUser(userName);
        
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error });
    }

    //return result
    delete user.password;
    return formatJSONResponse({ "user": user });
};

export const main = middyfy(getUserInfo);