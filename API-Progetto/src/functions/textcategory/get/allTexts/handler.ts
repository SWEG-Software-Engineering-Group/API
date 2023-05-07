import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetAllTexts } from 'src/services/dbTextCategory';
import { dbcheckUserInTenant } from 'src/services/dbTenant';
import { Text } from 'src/types/Text';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getAllTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String)
     * OUTPUT:  {response: Text[]} / Error
     * 
     * DESCRIPTION: returns all texts from a tenant, else return error.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (user, admin);
     *  -   check input, sanitize and validate;
     *  -   check user is authorized inside the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized for this function;
     *  -   user is not authorized inside this tenant;
     *  -   input is empty;
     *  -   input is invalid
     *  -   request to db failed;
     *  -   list of texts is empty;
     */


    const entities = require("entities");

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "no valid input" }, 400);

    //var sanitizer = require('sanitize-html')();

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    if (tenant === '')
        return formatJSONResponse({ "error": "input is empty" }, 400);

    //check user is admin inside this tenant
    if (false)
        if (dbcheckUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" }, 400);
    //TO DO
    try {
        //collect the data from db
        var texts: Text[] = await (dbgetAllTexts(tenant));
        if (!texts || texts.length==0)
            return formatJSONResponse({ "error": "no texts found" }, 400);
    }
    catch (error) {
        //if connection fails do stuff
        console.log(error)
        return formatJSONResponse({ "error": error },200);
    }

    //return result
    return formatJSONResponse({ "response": entities.decodeHTML(texts) }, 200);
};

export const main = middyfy(getAllTexts);