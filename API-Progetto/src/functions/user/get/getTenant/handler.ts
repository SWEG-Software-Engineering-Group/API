import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetUserTenant } from 'src/services/dbTenant';

import schema from './schema';

const getUserTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try
  {
    let tenants = await dbgetUserTenant(event.pathParameters.username.toString());
    // Return errror if no tenant is found
    if (tenants.length == 0) {
      return formatJSONResponse(
        {
          "Error": "No tenant found",
        },
        400
      );
    }
    return formatJSONResponse({tenants},200);
  } catch (error) {
    return formatJSONResponse(
      {
        "Error": error,
      },
      400
    );
  }
};

export const main = middyfy(getUserTenant);
