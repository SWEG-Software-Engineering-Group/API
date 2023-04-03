import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCategories, dbGetTexts } from 'src/services/dbTextCategory';
import { TextCategory } from 'src/types/TextCategory';

import schema from './schema';

const getCategories: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res = null;

  try {
    res = await dbgetCategories(event.pathParameters.TenantID);
  } catch (e) {
    return formatJSONResponse({ "error": e }, 403);
  }

  return formatJSONResponse({ "categories": res });

};

export const main = middyfy(getCategories);
