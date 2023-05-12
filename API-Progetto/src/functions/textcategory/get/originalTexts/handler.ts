import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbGetTexts } from 'src/services/dbTextCategory';

import schema from './schema';
import { Text } from 'src/types/Text';

const getOriginalTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: Text[] = null;
  try {
    res = await dbGetTexts(event.pathParameters.TenantId);
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
  return formatJSONResponse({ "texts": res });
};

export const main = middyfy(getOriginalTexts);
