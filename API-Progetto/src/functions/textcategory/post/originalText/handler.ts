import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbpostOriginalText, dbpostTranslation } from 'src/services/dbTextCategory';
import { dbAddCategoryToTenant, dbcheckUserInTenant, dbgetSecondaryLanguages, } from 'src/services/dbTenant';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const postOriginalText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), {body: Title(String), Category(String), Text(String), Comment(String), Link(String), Lanaguages[](String)}
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: check the category. if it doesn't exists already then it crates a new one.
     *              add a new text in the original language.
     *              create all the translations in the languages requested.
     *              else return error.
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
     *  -   language requested does not exist;
     *  -   user requested does not exist;
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "no valid input" }, 400);
    if (event.body.Title == null || event.body.Text == null || event.body.Category == null)
        return formatJSONResponse({ "error": "body request missing parameters" }, 400);

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
    let title = sanitizeHtml(event.body.Title, { allowedTags: [], allowedAttributes: {} });
    let text = sanitizeHtml(event.body.Text); //allow default tags and attributes for html formatting of text
    let category = sanitizeHtml(event.body.Category, { allowedTags: [], allowedAttributes: {} });
    let comment = sanitizeHtml(event.body.Comment, { allowedTags: [], allowedAttributes: {} });
    let link = sanitizeHtml(event.body.Link, { allowedTags: [], allowedAttributes: {} });
    //event.body.Languages need sanitization;
    let languages = event.body.Languages;
    if (tenant === '' || title === '' || text === '' || category === '' || event.body.Languages == null)
        return formatJSONResponse({ "error": "input is empty" }, 400);


    //check user is admin inside this tenant
    if (false)
        if (dbcheckUserInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" }, 400);
    //TO DO

    try {
        //check if all the languages are inside the Tenant.
        let lang: Array<String> = await dbgetSecondaryLanguages(tenant) as Array<String>;
        languages.forEach(function (language) {
            if (lang.indexOf(language) === -1)
                throw { "error": " one of the languages is not present inside the Tenant" };
        });
        //add category if it doesn't already exists get the id and use it
        let categoryId: string = await dbAddCategoryToTenant(tenant, category);
        //create the original text
        await dbpostOriginalText(tenant, title, categoryId, text, comment, link);
        //iterate over all languages to create the new translation
        await Promise.all(languages.map(async (language) => {
            await dbpostTranslation(tenant, title, categoryId, language, comment, link);
        }));
    }
    catch (error) {
        console.log(error);
        //if connection fails do stuff
        return formatJSONResponse({ "error": error }, 400);
    }

    //return result
    return formatJSONResponse({ "result": 'OK' });
};

export const main = middyfy(postOriginalText);