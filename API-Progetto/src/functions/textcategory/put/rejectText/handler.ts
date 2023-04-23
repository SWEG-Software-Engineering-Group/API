import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateText } from 'src/services/dbTextCategory';

import schema from './schema';
import { state } from 'src/types/TextCategory';

const putRejectText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    await updateText(event.pathParameters.TenantId, event.pathParameters.Language, event.pathParameters.Category, event.pathParameters.Title, state.rifiutato);

    return formatJSONResponse({ "message": "success" });

  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
};

export const main = middyfy(putRejectText);
