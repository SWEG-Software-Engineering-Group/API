import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbRemoveUserFromTenant } from 'src/services/dbTenant';

import schema from './schema';

const removeTenantUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse(
        {
          "error": "Missing tenantId",
        },
        400
      );
    }
    if (event.body.User === undefined) {
      return formatJSONResponse(
        {
          "error": "Invalid Body Format",
        },
        400
      );
    }
    let tenant = await dbRemoveUserFromTenant(event.pathParameters.TenantId, event.body.User.toString());
    return formatJSONResponse({tenant}, 200);
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

export const main = middyfy(removeTenantUser);
