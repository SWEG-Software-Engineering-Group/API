import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenants } from 'src/services/dbTenant';


import schema from './schema';

const getTenants: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let tenants = await dbgetTenants();
  return formatJSONResponse(tenants);
};

export const main = middyfy(getTenants);
