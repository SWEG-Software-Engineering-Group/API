import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCategory } from 'src/services/dbText';
import { TextCategory } from 'src/types/TextCategory';
import schema from './schema';

const getCategory: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), category (String)
     * OUTPUT:  Tenant => category (TextCategoryOBJ)
     * 
     * DESCRIPTION: returns an entire category from a Tenant, else return error.
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
     *  -   category requested does not exist;
     *  -   user is not authorized inside this tenant;
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.category)
        return formatJSONResponse({ "error": "no valid input" });

    var sanitizer = require('sanitize')();

    let tenant = sanitizer.value(event.pathParameters.TenantId, /^[A-Za-z0-9]+$/)
    let name = sanitizer.value(event.pathParameters.category, /^[A-Za-z0-9]+$/)
    if (name === '' || tenant === '')
        return formatJSONResponse({ "error": "input is empty" });


    try {
        //check requested tenant exist
        //TO DO

        //collect the data from db
        var category: TextCategory = await dbgetCategory(tenant, name);
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
    return formatJSONResponse({ "category": category });
};

export const main = middyfy(getCategory);