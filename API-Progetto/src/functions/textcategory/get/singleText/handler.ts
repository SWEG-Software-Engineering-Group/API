import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbGetTexts } from 'src/services/dbTextCategory';
import { Text } from 'src/types/Text';

import schema from './schema';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: Text = null;
  try {
    res = await dbGetTexts(event.pathParameters.TenantId, event.pathParameters.Language, event.pathParameters.Category, event.pathParameters.Title);

    return formatJSONResponse({ "Text": res });

  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
};

export const main = middyfy(getText);
