import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbdeleteTenant } from 'src/services/dbTenant';


import schema from './schema';

const deleteTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    try {
      let tenants = await dbdeleteTenant(event.pathParameters.tenantId);
      return formatJSONResponse({tenants});
    } catch (error) {
      return formatJSONResponse(
        {
          error,
        }
      );
    }
  
};

export const main = middyfy(deleteTenant);
