import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCategories } from 'src/services/dbText';
import { TextCategory } from 'src/types/TextCategory';

import schema from './schema';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res = null;

  try {
    res = await dbgetCategories(event.pathParameters.TenantID);
  } catch (e) {
    return formatJSONResponse({ "error": e }, 403);
  }

  return formatJSONResponse({ "categories": res.item as TextCategory[] });

};

export const main = middyfy(getText);
