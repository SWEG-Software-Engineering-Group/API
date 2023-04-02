import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbcheckAdminInTenant } from 'src/services/dbTenant';
import { dbdeleteText } from 'src/services/dbText';
import schema from './schema';

const deleteText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), TextId (String)
     * OUTPUT:  Tenant => Remove(TextId)
     * 
     * DESCRIPTION: remove a text orignial or translation, else return error.
     *          if text is original then remove also all translations.
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
     *  -   text requested does not exist;
     *  -   user is not authorized inside this tenant;
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.TextId == null)
        return formatJSONResponse({ "error": "no valid input" });

    var sanitizer = require('sanitize')();

    let tenant = sanitizer.value(event.pathParameters.TenantId, /^[A-Za-z0-9]+$/)
    let text = sanitizer.value(event.pathParameters.TextId, /^[A-Za-z0-9]+$/)
    if (text     === '' || tenant === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //check requested tenant exist
        //TO DO

        //cosa devo fare se il testo è in lingua originale? devo cancellare anche le traduzioni? come faccio?


        //execute the delete
        await dbdeleteText(tenant, text);

        //if connection fails do stuff
        //TO DO
    }
    catch(error){
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "result": "OK" });
};

export const main = middyfy(deleteText);