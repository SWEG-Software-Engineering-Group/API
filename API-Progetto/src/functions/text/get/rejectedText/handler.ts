import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { textsOfState } from 'src/services/dbText';

import schema from './schema';
import { TextCategory, state } from 'src/types/TextCategory';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: TextCategory[] = null;
  try {
    res = await textsOfState(event.pathParameters.TenantID, event.pathParameters.language, state.rifiutato);
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
  return formatJSONResponse({ "texts": res });
};

export const main = middyfy(getText);
