import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgdeleteUser } from 'src/services/userManager';


import schema from './schema';

const deleteUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.Username == null) {
      return formatJSONResponse(
        {
          "error": "Missing Username",
        },
        400
      );
    }
    await cgdeleteUser(event.pathParameters.Username);
    return formatJSONResponse({}, 200);
  } catch (error) {
    return formatJSONResponse(
      {
        error,
      },
      400
    );
  }

};

export const main = middyfy(deleteUser);
