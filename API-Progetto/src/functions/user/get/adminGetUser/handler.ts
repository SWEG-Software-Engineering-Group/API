import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgAdminGetUser } from 'src/services/userManager';

import schema from './schema';

const admGetUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.username == null) {
      return formatJSONResponse(
        {
          "error": "Missing username",
        },
        400
      );
    }
    let users = await cgAdminGetUser(event.pathParameters.username);
    return formatJSONResponse({users}, 200);
  } catch (error) {
    return formatJSONResponse(
      {
        error,
      },
      400
    );
  }
};

export const main = middyfy(admGetUser);
