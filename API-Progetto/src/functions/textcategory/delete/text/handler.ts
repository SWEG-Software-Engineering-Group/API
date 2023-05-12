import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbcheckAdminInTenant } from 'src/services/dbTenant';
import { dbdeleteText } from 'src/services/dbTextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const deleteText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), Title (String), Category(String)
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: delete all texts original and translation corresponding to a specific Title inside a Category from a Tenant, else return error.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (admin);
     *  -   check input, sanitize and validate;
     *  -   check user is authorized inside the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized for this function;
     *  -   user is not authorized inside this tenant;
     *  -   input is empty;
     *  -   input is invalid;
     *  -   request to db failed;
     */


    //check user is allowed to use this function COGNITO
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.Title == null || event.pathParameters.Category == null)
        return formatJSONResponse({ "error": "no valid input" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    let title = sanitizeHtml(event.pathParameters.Title, { allowedTags: [], allowedAttributes: {} })
    let category = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} })
    if (title === '' || tenant === '' || category === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //execute the delete
        await dbdeleteText(tenant, title, category);
    }
    catch (error) {
        //request to db failed
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "result": "OK" });
};

export const main = middyfy(deleteText);