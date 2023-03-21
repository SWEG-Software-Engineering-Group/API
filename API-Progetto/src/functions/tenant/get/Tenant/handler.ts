import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenantinfo } from 'src/services/dbTenant';


import schema from './schema';

const getTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let tenant=await dbgetTenantinfo(event.pathParameters.tenantid);
  return formatJSONResponse({tenant});
};

export const main = middyfy(getTenant);
