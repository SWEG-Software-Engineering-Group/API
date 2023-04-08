import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { AdminGetUser } from 'src/services/userManager';

import schema from './schema';

const getUsers: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let users = await AdminGetUser(event.pathParameters.username);
  return formatJSONResponse({users});
  
};

export const main = middyfy(getUsers);
