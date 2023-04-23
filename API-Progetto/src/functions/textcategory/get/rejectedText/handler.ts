import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { textsOfState } from 'src/services/dbTextCategory';

import schema from './schema';
import { TextCategory, state } from 'src/types/TextCategory';

const getRejectedTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: TextCategory[] = null;
  try {
    res = await textsOfState(event.pathParameters.TenantID, event.pathParameters.Language, state.rifiutato);
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
  return formatJSONResponse({ "texts": res });
};

export const main = middyfy(getRejectedTexts);
