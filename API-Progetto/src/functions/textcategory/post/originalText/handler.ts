import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbpostOriginalText } from 'src/services/dbTextCategory';
import { dbAddCategoryToTenant, dbcheckUserInTenant } from 'src/services/dbTenant';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const postOriginalText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), {body: Title(String), Category(String), Text(String), Comment(String), Link(String)}
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: add a new text in the original language, else return error.
     * 
     * SAFETY:  
     *  -   check authorization of the user for this function with Cognito (admin);
     *  -   check input, sanitize, validate;
     *  -   check user is authorized inside the requested tenant;
     *  
     *  EXCEPTIONS:
     *  -   user is not authorized for this function;
     *  -   user is not authorized inside this tenant;
     *  -   input is empty;
     *  -   input is invalid;
     *  -   request to db failed;
     *  -   tenant requested does not exist;
     *  -   user requested does not exist;
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "no valid input" });
    if (event.body.Title == null || event.body.Text == null || event.body.Category == null)
        return formatJSONResponse({ "error": "body request missing parameters" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
    let title = sanitizeHtml(event.body.Title, { allowedTags: [], allowedAttributes: {} });
    let text = sanitizeHtml(event.body.Text); //allow default tags and attributes for html formatting of text
    let category = sanitizeHtml(event.body.Category, { allowedTags: [], allowedAttributes: {} });
    let comment = sanitizeHtml(event.body.Comment, { allowedTags: [], allowedAttributes: {} });
    let link = sanitizeHtml(event.body.Link, { allowedTags: [], allowedAttributes: {} });
    if (tenant === '' || title === '' || text === '' || category === '')
        return formatJSONResponse({ "error": "input is empty" });

    
    //check user is admin inside this tenant
    if (false)
        if (dbcheckUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //collect the data from db
        await dbAddCategoryToTenant(title, category);
        await dbpostOriginalText(tenant, title, category, text, comment, link);
        
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "result": 'OK' });
};

export const main = middyfy(postOriginalText);