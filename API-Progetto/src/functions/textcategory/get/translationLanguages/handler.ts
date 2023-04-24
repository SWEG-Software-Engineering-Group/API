import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTranslationsLanguages } from 'src/services/dbTextCategory';
import { dbcheckUserInTenant } from 'src/services/dbTenant';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getTranslationLanguages: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), Category(String), Title(String)
     * OUTPUT:  {response: String[]} / Error
     * 
     * DESCRIPTION: returns all languages witch an original text from a Tenant is translated to, else return error.
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
     *  -   input is invalid;
     *  -   request to db failed;
     */

    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.Category == null || event.pathParameters.Title == null)
        return formatJSONResponse({ "error": "no valid input" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    let category = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} })
    let title = sanitizeHtml(event.pathParameters.Title, { allowedTags: [], allowedAttributes: {} })

    if (tenant === '' || category === '' || title === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //collect the data from db
        var languages = await dbgetTranslationsLanguages(tenant, category, title);
        if (!languages || languages.length == 0)
            return formatJSONResponse({ "error": "no texts found" });
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "response": languages });
};

export const main = middyfy(getTranslationLanguages);