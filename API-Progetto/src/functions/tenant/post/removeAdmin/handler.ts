import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbRemoveAdminFromTenant } from 'src/services/dbTenant';

import schema from './schema';

const removeTenantAdmin: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.tenantId == null) {
      return formatJSONResponse(
        {
          "error": "Missing tenantId",
        },
        400
      );
    }
    let tenant = await dbRemoveAdminFromTenant(event.pathParameters.tenantId, event.body.Admin.toString());
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

export const main = middyfy(removeTenantAdmin);