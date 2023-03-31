import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbGetTexts, updateText } from 'src/services/dbTextCategory';
import { state } from 'src/types/Text';
import { TextCategory } from 'src/types/TextCategory';

import schema from './schema';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    await updateText(event.pathParameters.TenantID, event.pathParameters.language, event.pathParameters.textCategory4, event.pathParameters.textId, state.verificato);

    return formatJSONResponse({ "message": "success" });

  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
};

export const main = middyfy(getText);
