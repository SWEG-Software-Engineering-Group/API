import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetSecondaryLanguage } from 'src/services/dbTenant';
import schema from './schema';

const getTenantLanguages: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try{
    if (event.pathParameters.tenantId == null) {
      return formatJSONResponse(
        {
          "Error": "Missing tenantId",
        },
        400
      );
    }
    let languages=await dbgetSecondaryLanguage(event.pathParameters.TenantId.toString());
    return formatJSONResponse({languages}, 200);
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

export const main = middyfy(getTenantLanguages);
