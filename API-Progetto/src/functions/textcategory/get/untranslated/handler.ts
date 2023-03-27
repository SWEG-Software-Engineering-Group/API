import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { textsOfState } from 'src/services/dbTextCategory';
import { state, Text } from 'src/types/Text';

import schema from './schema';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: Text[] = null;
  try {
    res = await textsOfState(event.pathParameters.TenantID, event.pathParameters.language, state.daTradurre);
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
  return formatJSONResponse({ "texts": res });
};

export const main = middyfy(getText);
