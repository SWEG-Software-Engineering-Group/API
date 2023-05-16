import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgsendResetCode } from 'src/services/userManager';

import schema from './schema';

const getResetCode: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.Username == null) {
      return formatJSONResponse(
        {
          "error": "Missing Username",
        },
        400
      );
    }
    let user = await cgsendResetCode(event.pathParameters.Username);
    return formatJSONResponse({ user });
  } catch (error) {
    console.log(error);
    return formatJSONResponse(
      {
        "Error": error,
      },
      400
    );
  }
};

export const main = middyfy(getResetCode);
