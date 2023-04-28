import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbputOriginalText, dbputTextCategory } from 'src/services/dbTextCategory';
import { dbcheckAdminInTenant, dbgetSecondaryLanguages, dbAddCategoryToTenant } from 'src/services/dbTenant';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const putOriginalText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String), {body: Title(String), Category(String), Text(String), Comment(String), Link(String)}
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: update the data of a specific text in original language, else return error.
     *              if the category has been changed then transfer all text and translation to the new category.
     *              if the comment or link has been changed propagate the change to all translations.
     *              if the languages list has been changed delete or create translations accordingly.
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
     *  -   one of the language required is not inside the Tenant;
     */


    //check user is allowed to use this function
    //TO DO

    //sanitize input and check if is empty
    if (event.pathParameters.TenantId == null || event.pathParameters.Category == null || event.pathParameters.Title == null)
        return formatJSONResponse({ "error": "no valid input" });
    if (event.body.Title == null || event.body.Text == null || event.body.Category == null || event.body.Languages == null)
        return formatJSONResponse({ "error": "body request is missing parameters" });

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
    let title = sanitizeHtml(event.pathParameters.Title, { allowedTags: [], allowedAttributes: {} });
    let text = sanitizeHtml(event.body.Text);
    let category = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} });
    let newcategory = sanitizeHtml(event.body.Category, { allowedTags: [], allowedAttributes: {} });
    let comment = sanitizeHtml(event.body.Comment, { allowedTags: [], allowedAttributes: {} });
    let link = sanitizeHtml(event.body.Link, { allowedTags: [], allowedAttributes: {} });
    //need to sanitize this event.body.Languages
    let languages = event.body.Languages;
    if (tenant === '' || title === '' || text === '' || category === '' || newcategory === '' || languages === '')
        return formatJSONResponse({ "error": "input is empty" });

    //check user is admin inside this tenant
    if (false)
        if (dbcheckAdminInTenant(tenant, "Username"))
            return formatJSONResponse({ "error": "user not in this tenant" });
    //TO DO

    try {
        //check if all the languages are inside the Tenant.
        let lang = await dbgetSecondaryLanguages(tenant);
        languages.forEach(function (language) {
            if (lang.include(language))
                throw { "error": " one of the languages is not present inside the Tenant" };
        });
        //if category has been changed, transfer all texts to new category
        if (category !== newcategory) {
            await dbAddCategoryToTenant(tenant, newcategory);
            await dbputTextCategory(tenant, category, title, newcategory);
        }
                //modify the data of the original text and translations
        await dbputOriginalText(tenant, newcategory, title, text, comment, link);
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error });
    }

    //return result
    return formatJSONResponse({ "result": 'OK' });
};

export const main = middyfy(putOriginalText);