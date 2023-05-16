import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';


import schema from './schema';

const getTextFromCatLang: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res = null;
  try {
    if (event.pathParameters.TenantId == null)
      return formatJSONResponse({ "error": "Missing TenantId" }, 400);
    if (event.pathParameters.Language == null)
      return formatJSONResponse({ "error": "Missing Language" }, 400);
    res = await dbgetByCategory(event.pathParameters.TenantId, event.pathParameters.Category, event.pathParameters.Language, event.pathParameters.Title);
    if (res == false)
      return formatJSONResponse({ "error": "Text not found" }, 400);
    return formatJSONResponse({ "Text": res });
  } catch (error) {
    return formatJSONResponse({ "error": error }, 403);
  }
};
export const main = middyfy(getTextFromCatLang);
