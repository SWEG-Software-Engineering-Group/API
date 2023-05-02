import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { textsOfState } from 'src/services/dbTextCategory';
import { state } from 'src/types/TextCategory';
import { Text } from 'src/types/Text';

import schema from './schema';

const getToBeTranslated: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: Text[] = null;
  try {
    if (event.pathParameters.TenantId == null)
      return formatJSONResponse({ "error": "Missing TenantID" }, 400);
    if (event.pathParameters.Language == null)
      return formatJSONResponse({ "error": "Missing Language" }, 400);
    res = await textsOfState(event.pathParameters.TenantId, event.pathParameters.Language, state.daTradurre);
  } catch (e) {
    return formatJSONResponse({ "error": e }, 403);
  }
  return formatJSONResponse({ "texts": res });
};
export const main = middyfy(getToBeTranslated);
