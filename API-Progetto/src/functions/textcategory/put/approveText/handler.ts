import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateText } from 'src/services/dbTextCategory';


import schema from './schema';
import { state } from 'src/types/TextCategory';

const putAcceptText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.TenantId == null)
      return formatJSONResponse({ "error": "Missing TenantId" }, 400);
    if (event.pathParameters.Language == null)
      return formatJSONResponse({ "error": "Missing Language" }, 400);
    if (event.pathParameters.Category == null)
          return formatJSONResponse({ "error": "Missing Category" }, 400);
      console.log("all fields are filled");
    await updateText(event.pathParameters.TenantId, event.pathParameters.Language, event.pathParameters.Category, event.pathParameters.Title.replaceAll("%20", " "), state.verificato);
    return formatJSONResponse({ "message": "success" });
  } catch (err) {
    return formatJSONResponse({ "error": err }, 403);
  }
};

export const main = middyfy(putAcceptText);
