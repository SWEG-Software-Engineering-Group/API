import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetDefaultLanguage, dbdeleteLanguage } from 'src/services/dbTenant';
import { dbcheckAdminInTenant } from 'src/services/dbTenant';
import schema from './schema';

const deleteLanguage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), language (String)
     * OUTPUT:  Tenant => Remove(TextCategory[], language)
     * 
     * DESCRIPTION: remove all categories from a language (thus delete all translations), else return error.
     *      cannot remove the the original language.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (user, admin, superadmin);
     *  -   check input is valid, not null and sanitize it;
     *  -   check user is authorized inside the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized for this function;
     *  -   input is empty;
     *  -   connection to db failed;
     *  -   language requested does not exist;
     *  -   language requested is original language;
     *  -   user is not authorized inside this tenant;
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.language == null)
        return formatJSONResponse({ "error": "no valid input" });

    var sanitizer = require('sanitize')();

    let tenant = sanitizer.value(event.pathParameters.TenantId, /^[A-Za-z0-9]+$/)
    let language = sanitizer.value(event.pathParameters.language, /^[A-Za-z0-9]+$/)
    if (language     === '' || tenant === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //check requested tenant exist
        //TO DO

        //check language is not default
        var result: string = await dbgetDefaultLanguage (tenant);
        if (result === "")
            return formatJSONResponse({ "error": "an error happened somwhere in the db" });
        if (result === language)
            return formatJSONResponse({ "error": "language is original" });

        //execute the delete
        await dbdeleteLanguage(tenant, language);

        //if connection fails do stuff
        //TO DO
    }
    catch(error){
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "result": "OK" });
};

export const main = middyfy(deleteLanguage);