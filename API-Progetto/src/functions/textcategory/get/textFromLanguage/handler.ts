import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetByLanguage } from 'src/services/dbTextCategory';
import { dbcheckUserInTenant } from 'src/services/dbTenant';
import { Text } from 'src/types/Text';
import { state } from 'src/types/TextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getTextFromLanguage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), Language (String)
     * OUTPUT:  {response: Text[]} / Error
     * 
     * DESCRIPTION: returns all texts from a language inside a Tenant, else return error.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (user, admin);
     *  -   check input, sanitize, validate;
     *  -   check user is authorized inside the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized for this function;
     *  -   user is not authorized inside this tenant;
     *  -   input is empty;
     *  -   iput is invalid;
     *  -   request to db failed;
     *  -   list of texts is empty; 
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.Language == null)
        return formatJSONResponse({ "error": "no valid input" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    let language = sanitizeHtml(event.pathParameters.Language, { allowedTags: [], allowedAttributes: {} })
    if (language === '' || tenant === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //collect the data from db
        var texts: Text[] = await dbgetByLanguage(tenant, language, state.verificato);
        if (!texts || texts.length == 0)
            return formatJSONResponse({ "error": "no texts found" });        
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "response": texts });
};

export const main = middyfy(getTextFromLanguage);