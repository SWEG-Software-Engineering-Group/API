import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetDefaultLanguage } from 'src/services/dbTenant';


import schema from './schema';

const getDefaultLanguage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try{
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse(
        {
          "error": "Missing tenantId",
        },
        400
      );
    }
    let tenantId = event.pathParameters.TenantId.toString();
    let defaultLanguage=await dbgetDefaultLanguage(tenantId);
    return formatJSONResponse({defaultLanguage}, 200);
  }
  catch(error){
    console.log(error);
    return formatJSONResponse(
      {
        "Error": error,
      },
      400
    );
  }
};

export const main = middyfy(getDefaultLanguage);
