import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { removeUserRole } from 'src/services/userManager';

import schema from './schema';

const removeRole: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    let role = await removeUserRole(event.pathParameters.username, event.body.group.toString());
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

export const main = middyfy(removeRole);
