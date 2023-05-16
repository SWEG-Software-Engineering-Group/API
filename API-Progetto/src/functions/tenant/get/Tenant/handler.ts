import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenantinfo } from 'src/services/dbTenant';


import schema from './schema';

const getTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse(
        {
          "Error": "Missing TenantId",
        },
        400
      );
    }
    let tenant = await dbgetTenantinfo(event.pathParameters.TenantId.toString());
    return formatJSONResponse({ tenant }, 200);
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

export const main = middyfy(getTenant);
