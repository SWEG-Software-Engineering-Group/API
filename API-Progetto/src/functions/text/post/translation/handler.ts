import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbpostTranslation } from 'src/services/dbText';
import { dbcheckUserInTenant } from 'src/services/dbTenant';
import schema from './schema';

const postTranslation: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), {body: Title(String), Language(String), Category(String), Text(String)}
     * OUTPUT:  {result: OK} / Error
     *
     * DESCRIPTION: add a new translation, else return error.
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
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "no valid input" });
    if (event.body.Title == null ||event.body.Text == null || event.body.Category == null, event.body.Language == null)
        return formatJSONResponse({ "error": "body request missing parameters" });

    var sanitizer = require('sanitize-html')();

    let tenant = sanitizer(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
    let title = sanitizer(event.body.Title, { allowedTags: [], allowedAttributes: {} });
    let text = sanitizer(event.body.Text); //allow default tags and attributes for html formatting of text
    let category = sanitizer(event.body.Category, { allowedTags: [], allowedAttributes: {} });
    let language = sanitizer(event.body.Language, { allowedTags: [], allowedAttributes: {} })
    if (tenant === '' || title === '' || text === '' || category === '' || language === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {

        //collect the data from db
        await dbpostTranslation(tenant, title, category, language, text);
        
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": "db connection failed OR tenant does not exist OR other" });
    }

    //return result
    return formatJSONResponse({ "result": 'OK' });
};

export const main = middyfy(postTranslation);