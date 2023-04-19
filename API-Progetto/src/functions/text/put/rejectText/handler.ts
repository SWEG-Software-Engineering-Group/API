import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { updateText } from 'src/services/dbTextCategory';

import schema from './schema';
import { state } from 'src/types/TextCategory';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    await updateText(event.pathParameters.TenantID, event.pathParameters.language, event.pathParameters.category, event.pathParameters.id, state.rifiutato);

    return formatJSONResponse({ "message": "success" });

  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
};

export const main = middyfy(getText);
