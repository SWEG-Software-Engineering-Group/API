import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbGetTexts } from 'src/services/dbTextCategory';
import { TextCategory } from 'src/types/TextCategory';

import schema from './schema';

const getTextById: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: TextCategory[] = null;
  try {
    res = await dbGetTexts(event.pathParameters.TenantID, event.pathParameters.language, event.pathParameters.textCategory, event.pathParameters.textId);

    return formatJSONResponse({ "texts": res });

  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
};

export const main = middyfy(getTextById);
