import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenants } from 'src/services/dbTenant';
import { authorizer } from "src/middleware/validators";

import schema from './schema';

const getTenants: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async () => {
  let tenants = await dbgetTenants();
  return formatJSONResponse(tenants);
};

export const main = middyfy(authorizer(getTenants, ["admin"]));
