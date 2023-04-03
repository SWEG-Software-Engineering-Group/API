import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
//import { dbSearchSpecific } from 'src/services/dbText';
import { checkUserInTenant } from 'src/services/dbTenant';
import { TextCategory } from 'src/types/TextCategory';
import schema from './schema';

const getTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String)
     * OUTPUT:  Tenant => ContentUser
     * 
     * DESCRIPTION: returns the ContentUsers requested inside a Tenant with all its informations, else return error.
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
     *  -   tenant requested does not exist;
     *  -   user requested does not exist;
     *  -   user is not authorized inside this tenant;
     *  -   tenant list of users is empty; 
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.language == null, event.pathParameters.textCategory2 == null)
        return formatJSONResponse({ "error": "no valid input" });

    var sanitizer = require('sanitize')();

    let tenant = sanitizer.value(event.pathParameters.TenantId, /^[A-Za-z0-9]+$/)
    let language = sanitizer.value(event.pathParameters.language, /^[A-Za-z0-9]+$/)
    let category = sanitizer.value(event.pathParameters.category, /^[A-Za-z0-9]+$/)

    if (tenant === '' || language === '' || category === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (checkUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //check requested tenant exist
        //TO DO

        //collect the data from db
        //var texts: TextCategory = await dbSearchSpecific(tenant, language, category);
        //if connection fails do stuff
        //TO DO
    }
    catch(error){
        return formatJSONResponse({ "error": "db connection failed OR tenant does not exist OR other" });
    }

    //return result
    var texts = "";
    return formatJSONResponse({ "texts": texts });
};

export const main = middyfy(getTexts);