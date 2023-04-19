import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenant, dbcheckAdminInTenant } from 'src/services/dbTenant';
import { Tenant } from 'src/types/Tenant';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getTenantUsers: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String)
     * OUTPUT:  {users: Tenant.ContentUser[string]}  / Error
     * 
     * DESCRIPTION: returns the list of all ContentUsers Usernames inside the requested Tenant, else return error.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (user, admin, superadmin);
     *  -   check input, sanitize and validate;
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
    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "no valid input" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    if (tenant === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //collect the data from db
        var tenantOBJ: Tenant = await dbgetTenant(tenant);
        if (!tenantOBJ.users || tenantOBJ.users.length == 0)
            return formatJSONResponse({ "error": "no users found in this tenant" });
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error});
    }
    //return result
    return formatJSONResponse({ "users": tenantOBJ.users });
};

export const main = middyfy(getTenantUsers);