import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbcheckAdminInTenant, dbputCategory } from 'src/services/dbTenant';
import schema from './schema';

const putCategory: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), Category(String), {body: Name(String)}
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: update the name of the category, else return error.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (admin);
     *  -   check input is valid, not null and sanitize it;
     *  -   check user is authorized inside the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized for this function;
     *  -   user is not authorized inside this tenant;
     *  -   input is empty;
     *  -   input is invalid;
     *  -   request to db failed;
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.Category == null)
        return formatJSONResponse({ "error": "no valid input" });
    if (event.body.Name == null )
        return formatJSONResponse({ "error": "body request missing parameters" });

    var sanitizer = require('sanitize-html')();

    let tenant = sanitizer(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
    let name = sanitizer(event.body.Name, { allowedTags: [], allowedAttributes: {} });
    let category = sanitizer(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} });
    if (tenant === '' || name === '' || category === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //collect the data from db
        await dbputCategory(tenant, category, name);
        
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "result": 'OK' });
};

export const main = middyfy(putCategory);