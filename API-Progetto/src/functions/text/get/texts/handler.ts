import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetAllTexts } from 'src/services/dbText';
import { Text } from 'src/types/Text';
import schema from './schema';

const getAllTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
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

    var sanitizer = require('sanitize')();

    let name = sanitizer.value(event.pathParameters.TenantId, /^[A-Za-z0-9]+$/)
    if (name === '')
        return formatJSONResponse({ "error": "input is empty" });


    try {
        //check requested tenant exist
        //TO DO

        //collect the data from db
        var text: Text = await dbgetAllTexts(name);
        //if connection fails do stuff
        //TO DO
    }
    catch(error){
        return formatJSONResponse({ "error": "db connection failed OR tenant does not exist OR other" });
    }

    //check user is inside this tenant
    if(false)
        if (!tenant.admins.includes("Username")) 
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    //return result
    return formatJSONResponse({ "texts": text });
};

export const main = middyfy(getAllTexts);