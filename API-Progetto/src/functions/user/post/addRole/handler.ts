import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgaddUserRole } from 'src/services/userManager';

import schema from './schema';

const addRole: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.Username == null)
      return formatJSONResponse({ "error": "Missing Username", }, 400);
    if (event.body.Group === undefined)
      return formatJSONResponse({ "error": "Invalid Body Format", }, 400);
    let role = await cgaddUserRole(event.pathParameters.Username, event.body.Group.toString());
    return formatJSONResponse({ role }, 200);
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
