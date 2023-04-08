import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getUserFromToken } from 'src/services/userManager';

import schema from './schema';

const getUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let user = await getUserFromToken(event.pathParameters.AccessToken);
  return formatJSONResponse({user});
  
};

export const main = middyfy(getUser);
