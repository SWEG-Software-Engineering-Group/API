import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenantUsers } from 'src/services/dbTenant';
import schema from './schema';

const tenantGetUsers: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse(
        {
          "Error": "Missing tenantId",
        },
        400
      );
    }
    let Users = await dbgetTenantUsers(event.pathParameters.TenantId.toString(), "content");
    return formatJSONResponse({ Users }, 200);
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

export const main = middyfy(tenantGetUsers);
