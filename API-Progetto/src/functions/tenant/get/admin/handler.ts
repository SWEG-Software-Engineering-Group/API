import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenant, dbcheckAdminInTenant } from 'src/services/dbTenant';
import { Tenant } from 'src/types/Tenant';
import schema from './schema';

const getTenantAdmins: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String)
     * OUTPUT:  {users: Tenan.Admins[string]} / Error
     * 
     * DESCRIPTION: returns the list of all Administrator Usernames inside the requested Tenant, else return error.
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
    //if (cognito.token.isvalid())
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "no valid input" });

    var sanitizer = require('sanitize-html')();

    let tenant = sanitizer(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
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
        if (!tenantOBJ.admins || tenantOBJ.admins.length == 0)
            return formatJSONResponse({ "error": "no admin found in this tenant" });
    }
    catch (error) {
        //if request fails do stuff
        return formatJSONResponse({ "error": error });
    }
    //return result
    return formatJSONResponse({ "users": tenantOBJ.admins });
};

export const main = middyfy(getTenantAdmins);