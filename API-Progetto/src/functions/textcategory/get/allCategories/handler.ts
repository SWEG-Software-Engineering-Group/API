import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCategories } from 'src/services/dbTenant';
import { TextCategory } from 'src/types/TextCategory';

import schema from './schema';

const getCategories: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res = null;

  try {
    if (event.pathParameters.TenantId == null)
      return formatJSONResponse({ "error": "Missing TenantID" }, 400);
    res = await dbgetCategories(event.pathParameters.TenantId);
    return formatJSONResponse({ "categories": res as TextCategory[] });
  } catch (e) {
    return formatJSONResponse({ "error": e }, 403);
  }
};

export const main = middyfy(getCategories);
