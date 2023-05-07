import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateText } from 'src/services/dbTextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';
import { state } from 'src/types/TextCategory';

const putRejectText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    const entities = require("entities");

    try {
        if (event.pathParameters.TenantId == null)
            return formatJSONResponse({ "error": "Missing TenantId" }, 400);
        if (event.pathParameters.Language == null)
            return formatJSONResponse({ "error": "Missing Language" }, 400);
        if (event.pathParameters.Category == null)
            return formatJSONResponse({ "error": "Missing Category" }, 400);

        let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} })
        let language = sanitizeHtml(event.pathParameters.Language, { allowedTags: [], allowedAttributes: {} })
        let category = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} })
        let title = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} })
        if (tenant === '' || language === '' || category === '' || title === '')
            return formatJSONResponse({ "error": "one of the inputs is empty" });
        console.log("before the first replaceAll");
        language = language.replaceAll("%20", " ");
        console.log("befoe the second replaceAll");
        title = title.replaceAll("%20", " ");
        console.log("all replaceAll done");
        let result = await updateText(tenant, language, category, title, state.rifiutato);
        console.log("update done:", result);
        return formatJSONResponse({ "result": entities.decodeHTML(result) },200);
    } catch (err) {
        return formatJSONResponse({ "error": err }, 403);
    }
};

export const main = middyfy(putRejectText);
