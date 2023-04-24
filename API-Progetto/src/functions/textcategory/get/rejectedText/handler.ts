import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { textsOfState } from 'src/services/dbTextCategory';

import schema from './schema';
import { TextCategory, state } from 'src/types/TextCategory';

const getRejectedTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: TextCategory[] = null;
  try {
    if (event.pathParameters.TenantId == null)
      return formatJSONResponse({ "error": "Missing TenantId" }, 400);
    if (event.pathParameters.Language == null)
      return formatJSONResponse({ "error": "Missing Language" }, 400);
    res = await textsOfState(event.pathParameters.TenantId, event.pathParameters.Language, state.rifiutato);
    return formatJSONResponse({ "texts": res });
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
};
export const main = middyfy(getRejectedTexts);
