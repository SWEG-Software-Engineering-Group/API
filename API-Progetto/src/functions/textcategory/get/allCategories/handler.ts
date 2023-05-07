import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCategories } from 'src/services/dbTenant';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';

const getCategories: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {

    const entities = require("entities");

  var res = null;

  try {
    if (event.pathParameters.TenantId == null)
          return formatJSONResponse({ "error": "Missing TenantID" }, 400);
      let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
      if (tenant === '')
          return formatJSONResponse({ "error": "TenantID input is empty" });
    res = await dbgetCategories(tenant);
    return formatJSONResponse({ "categories": entities.decodeHTML(res) },200);
  } catch (e) {
    return formatJSONResponse({ "error": e }, 403);
  }
};

export const main = middyfy(getCategories);
