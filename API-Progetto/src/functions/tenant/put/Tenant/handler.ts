import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbresetTenant } from 'src/services/dbTenant';

import schema from './schema';

const resetTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let tenants=await dbresetTenant(event.pathParameters.tenantId);
  return formatJSONResponse({tenants});
};

export const main = middyfy(resetTenant);
