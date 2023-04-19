import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbGetTexts } from 'src/services/dbText';
import { TextCategory } from 'src/types/TextCategory';

import schema from './schema';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: TextCategory[] = null;
  try {
    res = await dbGetTexts(event.pathParameters.TenantID, event.pathParameters.language, event.pathParameters.category, event.pathParameters.id);

    return formatJSONResponse({ "texts": res });

  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
};

export const main = middyfy(getText);
