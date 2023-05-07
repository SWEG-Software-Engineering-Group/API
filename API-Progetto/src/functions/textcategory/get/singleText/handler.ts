import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetSingleText } from 'src/services/dbTextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {

    const entities = require("entities");

  var res = null;
  try {
      if (event.pathParameters.TenantId == null)
          return formatJSONResponse({ "error": "Missing TenantId" }, 400);
      if (event.pathParameters.Language == null)
          return formatJSONResponse({ "error": "Missing Language" }, 400);
      if (event.pathParameters.Category == null)
          return formatJSONResponse({ "error": "Missing Category" }, 400);
      if (event.pathParameters.Title == null)
          return formatJSONResponse({ "error": "Missing Title" }, 400);
      let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
      let language = sanitizeHtml(event.pathParameters.Language, { allowedTags: [], allowedAttributes: {} });
      let category = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} });
      let title = sanitizeHtml(event.pathParameters.Category, { allowedTags: [], allowedAttributes: {} });
      if (tenant === '' || language === '' || category === '' || title === '')
          return formatJSONResponse({ "error": "one of the inputs is empty" });

    res = await dbgetSingleText(tenant, language, category, title);
    if (res == false)
      return formatJSONResponse({ "error": "Text not found" }, 400);
    return formatJSONResponse({ "Text": entities.decodeHTML(res) }, 200);
  } catch (error) {
    return formatJSONResponse({ "error": error }, 403);
  }
};
export const main = middyfy(getText);
