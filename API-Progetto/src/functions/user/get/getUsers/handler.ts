import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getListUserCognito } from 'src/services/userManager';

import schema from './schema';

const getUsers: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async () => {
  let users = await getListUserCognito();
  return formatJSONResponse({users});
  
};

export const main = middyfy(getUsers);
