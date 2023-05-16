import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cggetListUserCognito } from 'src/services/userManager';

import schema from './schema';

const getUsers: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async () => {
  try {
    let users = await cggetListUserCognito();
    return formatJSONResponse({ users });
  }
  catch (error) {
    return formatJSONResponse(
      {
        error,
      },
      400
    );
  }
};

export const main = middyfy(getUsers);
