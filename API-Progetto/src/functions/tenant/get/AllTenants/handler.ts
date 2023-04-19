import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetTenants } from 'src/services/dbTenant';

import schema from './schema';

const getTenants: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async () => {
  try{
    let tenants=await dbgetTenants();
    return formatJSONResponse(tenants, 200);
  } catch(error){
    console.log(error);
    return formatJSONResponse(
      {
        "Error": error,
      },
      400
    );
  }
};

export const main = middyfy(getTenants);
