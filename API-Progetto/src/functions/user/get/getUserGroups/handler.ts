import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cggetListUserGroups } from 'src/services/userManager';

import schema from './schema';

const getUserGroups: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try
  {
    if (event.pathParameters.username == null) 
    {
      return formatJSONResponse(
        {
          "error": "Missing username",
        },
        400
      );
    }
    let groups = await cggetListUserGroups(event.pathParameters.username.toString());
    return formatJSONResponse({groups});
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

export const main = middyfy(getUserGroups);
