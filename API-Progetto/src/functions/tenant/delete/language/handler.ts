import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbcheckAdminInTenant, dbgetDefaultLanguage, dbRemoveSecLanguageFromTenant } from 'src/services/dbTenant';
import { dbdeleteLanguageTexts } from 'src/services/dbTextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const deleteLanguage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), Language (String)
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: remove all texts (translations) from a language and then delete the language from the tenant, else return error.
     *      cannot remove the original language.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (admin);
     *  -   check input, sanitize and validate;
     *  -   check user belongs to the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized inside this tenant;
     *  -   user is not authorized for this function;
     *  -   input is empty;
     *  -   input is invalid;
     *  -   request to db failed;
     *  -   language requested is the original language;
     * 
     */


    //check user is allowed to use this function
    //TO DO///

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.Language == null)
        return formatJSONResponse({ "error": "no valid input" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
    let language = sanitizeHtml(event.pathParameters.Language, { allowedTags: [], allowedAttributes: {} });
    if (language === '' || tenant === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //check language is not default
        var result = await dbgetDefaultLanguage (tenant);
        if (result === "")
            return formatJSONResponse({ "error": "an error happened somwhere in the db" });
        if (result === language)
            return formatJSONResponse({ "error": "language is original" });

        //execute the delete
        await dbdeleteLanguageTexts(tenant, language);
        let out =  await dbRemoveSecLanguageFromTenant(tenant, language);
        return formatJSONResponse({ out }, 200);
    }
    catch (error) {
        //if request to fails do stuff
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "result": "OK" });
};

export const main = middyfy(deleteLanguage);