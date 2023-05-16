import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbputTranslation } from 'src/services/dbTextCategory';
import { dbgetDefaultLanguage } from 'src/services/dbTenant';
import { state } from 'src/types/TextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const putTranslation: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String) {body: Title(String), Language(String), Category(String), Text(String)}
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: update the text of a specific translation, else return error.
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
    if (event.pathParameters.TenantId == null || event.pathParameters.Language == null || event.pathParameters.Category == null || event.pathParameters.Title == null)
        return formatJSONResponse({ "error": "no valid input" }, 400);
    if (event.body.Text == null)
        return formatJSONResponse({ "error": "body request missing parameters" }, 400);

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    let title = sanitizeHtml(event.pathParameters.Title, { allowedTags: [], allowedAttributes: {} });
    let text = sanitizeHtml(event.body.Text);
    let category = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} });
    let language = sanitizeHtml(event.pathParameters.Language, { allowedTags: [], allowedAttributes: {} });
    //let feedback = "Default feedback"
    if (tenant === '' || title === '' || text === '' || category === '' || language === '')
        return formatJSONResponse({ "error": "input is empty" }, 400);

    try {
        //collect the data from db
        if (await dbgetDefaultLanguage(tenant) === language)
            return formatJSONResponse({ "error": "user not in this tenant" }, 400);
        let translation = await dbputTranslation(tenant, title, category, language, text, state.daVerificare);
        //return result
        return formatJSONResponse({ "result": translation }, 200);
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error }, 400);
    }

};

export const main = middyfy(putTranslation);