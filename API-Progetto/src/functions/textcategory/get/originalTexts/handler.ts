import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbGetTexts } from 'src/services/dbTextCategory';
import { TextCategory } from 'src/types/TextCategory';

import schema from './schema';

const getOriginalTexts: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: TextCategory[] = null;
  try {
    res = await dbGetTexts(event.pathParameters.TenantId);
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
  return formatJSONResponse({ "texts": res });
};

export const main = middyfy(getOriginalTexts);
