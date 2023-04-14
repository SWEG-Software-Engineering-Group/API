import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getUserFromToken } from 'src/services/userManager';

import schema from './schema';

const getUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try 
  {
    if (event.pathParameters.AccessToken == null) 
    {
      return formatJSONResponse(
        {
          "error": "Missing AccessToken",
        },
        400
      );
    }
    let user = await getUserFromToken(event.pathParameters.AccessToken);
    return formatJSONResponse({user});
  } catch (error) {
    return formatJSONResponse(
      {
        error,
      },
      400
    );
  }
};

export const main = middyfy(getUser);
