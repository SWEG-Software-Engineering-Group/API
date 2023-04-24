import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbresetTenant } from 'src/services/dbTenant';

import schema from './schema';

const resetTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try
  {
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse(
        {
          "error": "Missing TenantId",
        },
        400
      );
    }
    let tenants=await dbresetTenant(event.pathParameters.TenantId);
    return formatJSONResponse({tenants});
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

export const main = middyfy(resetTenant);
