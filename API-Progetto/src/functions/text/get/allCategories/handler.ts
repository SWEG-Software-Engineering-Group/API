import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCategories } from 'src/services/dbTenant';
import { Category } from 'src/types/Tenant';

import schema from './schema';

const getText: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res = null;

  try {
      res = await dbgetCategories(event.pathParameters.TenantID);
  } catch (e) {
    return formatJSONResponse({ "error": e }, 403);
  }

  return formatJSONResponse({ "categories": res as Category[] });

};

export const main = middyfy(getText);
