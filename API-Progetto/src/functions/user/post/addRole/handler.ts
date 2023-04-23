import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgaddUserRole } from 'src/services/userManager';

import schema from './schema';

const addRole: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.username == null) {
      return formatJSONResponse(
        {
          "error": "Missing username",
        },
        400
      );
    }
    if (event.body.group === undefined) {
      return formatJSONResponse(
        {
          "error": "Invalid Body Format",
        },
        400
      );
    }
    let role = await cgaddUserRole(event.pathParameters.username, event.body.group.toString());
    return formatJSONResponse({role}, 200);
  } catch (error) {
    console.log(error);
    return formatJSONResponse(
      {
        "error": error,
      },
      400
    );
  }
};

export const main = middyfy(addRole);
