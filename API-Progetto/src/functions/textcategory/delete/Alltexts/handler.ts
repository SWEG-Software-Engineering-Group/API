import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbdeleteAllTexts } from 'src/services/dbTextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const deleteAllTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    /*@by Milo Spadotto
     * INPUT:   Tenant (String)
     * OUTPUT:  {result: OK} / Error
     * 
     * DESCRIPTION: delete all texts original and translation from a Tenant, else return error.
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
    if (event.pathParameters.TenantId == null) {
        return formatJSONResponse({ "error": "no valid input" }, 400);
    }

    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
    if (tenant === '')
        return formatJSONResponse({ "error": "input is empty" }, 400);

    try {
        //execute the delete
        let result = await dbdeleteAllTexts(tenant);
        console.log("risultato", result);
    }
    catch (error) {
        //request to db failed
        return formatJSONResponse({ "error": error }, 400);
    }

    //return result
    return formatJSONResponse({ "result": "OK" }, 200);
};

export const main = middyfy(deleteAllTexts);