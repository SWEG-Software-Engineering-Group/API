import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { v4 as uuidv4 } from 'uuid';
import { dbpostOriginalText } from 'src/services/dbText';
import { dbcheckUserInTenant } from 'src/services/dbTenant';
import schema from './schema';

const postOriginalText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
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
    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "no valid input" });
    if (event.body.Text == null || event.body.categoryId == null)
        return formatJSONResponse({ "error": "body request missing parameters" });
    var sanitizer = require('sanitize')();

    let tenant = sanitizer.value(event.pathParameters.TenantId, /^[A-Za-z0-9]+$/);
    let text = sanitizer.value(event.body.Text, /^[A-Za-z0-9]+$/);
    let category = sanitizer.value(event.body.categoryId, /^[A-Za-z0-9]+$/);
    if (tenant === '' || text === '' || category === '')
        return formatJSONResponse({ "error": "input is empty" });

    
    //check user is admin inside this tenant
    if (false)
        if (dbcheckUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        let uuid=uuidv4();
        //check requested tenant exist
        //TO DO

        //collect the data from db
        await dbpostOriginalText(tenant, text, language+"#"+category+"#"+uuid);
        //if connection fails do stuff
        //TO DO
    }
    catch(error){
        return formatJSONResponse({ "error": "db connection failed OR tenant does not exist OR other" });
    }

    //return result
    return formatJSONResponse({ "OK": 'OK' });
};

export const main = middyfy(postOriginalText);