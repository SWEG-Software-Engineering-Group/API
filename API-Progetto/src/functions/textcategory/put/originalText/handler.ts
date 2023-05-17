import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbputOriginalText, dbputTextCategory, dbgetSingleText, dbgetTranslationsLanguages, dbpostTranslation, dbdeleteSingleText } from 'src/services/dbTextCategoryPut';
import { dbAddCategoryToTenant, dbgetTenantinfo } from 'src/services/dbTenant';
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
    if (event.body.Text == null || event.body.Category == null || event.body.Languages == null)
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
    if (tenant === '' || title === '' || text === '' || category === '' || newcategory === '') //|| languages.length === '-1') TO ADD IN SOME WAY
        return formatJSONResponse({ "error": "input is empty" });

    try {
        //check if all the languages are inside the Tenant.
        let tenantinfo = await dbgetTenantinfo(tenant);
        if (await dbgetSingleText(tenant, tenantinfo.defaultLanguage, category, title) === false)
            return formatJSONResponse({ "error": "this text does not exist" }, 400);
        languages.forEach(function (language) {
            if (!tenantinfo.languages.includes(language))
                return formatJSONResponse({ "error": " one of the languages is not present inside the Tenant" }, 400);
        });
        console.log("step 01");
        //get the id of current category (if not present creates it) and all translations languages 
        let id = await dbAddCategoryToTenant(tenant, newcategory);
        let translations = await dbgetTranslationsLanguages(tenant, category, title);
        //if one of the languages of the current translations is not present in the new list, delete it
        translations.forEach(function (language) {
            if (!languages.includes(language)) {
                console.log("deleting translation in:", language);
                dbdeleteSingleText(tenant, "<" + language + "&" + category + "'" + title + ">");
            }
        });
        console.log("step 02");
        //if category has been changed, transfer all texts to new category
        if (id != category) {
            console.log("category already present but different from current one", category, id);
            await dbputTextCategory(tenant, category, title, id);
        }
        console.log("step 03");
        //check all languages if not present create new translation
        languages.forEach(function (language) {
            if (!translations.includes(language)) {
                console.log("adding translation in:", language);
                dbpostTranslation(tenant, title, id, language, null, null);
            }
        });
        console.log("step 04");

        //updating the data of the original text and translations
        let original = await dbputOriginalText(tenant, id, title, text, comment, link, languages);
        return formatJSONResponse({ "result": original }, 200);
    }
    catch (error) {
        //if connection fails do stuff
        return formatJSONResponse({ "error": error }, 400);
    }
};

export const main = middyfy(putOriginalText);