import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getListUserGroups } from 'src/services/userManager';

import schema from './schema';

const getUserGroups: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let groups = await getListUserGroups(event.pathParameters.username.toString());
  return formatJSONResponse({groups});
  
};

export const main = middyfy(getUserGroups);
