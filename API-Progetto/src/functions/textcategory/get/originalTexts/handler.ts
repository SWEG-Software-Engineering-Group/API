import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbGetTexts } from 'src/services/dbTextCategory';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getOriginalTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {

    const entities = require("entities");

    if (event.pathParameters.TenantId == null)
        return formatJSONResponse({ "error": "Missing TenantId" }, 400);
    let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
    if (tenant === '')
        return formatJSONResponse({ "error": "TenantId input is empty" });
  try {
      let res = await dbGetTexts(tenant);
      return formatJSONResponse({ "texts": entities.decodeHTML(res) },200);
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
  
};

export const main = middyfy(getOriginalTexts);
