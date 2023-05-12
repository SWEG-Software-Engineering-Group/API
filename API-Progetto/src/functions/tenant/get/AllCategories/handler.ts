import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCategories } from 'src/services/dbTenant';
//
import schema from './schema';

const getAllCategories: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try{
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse({"Error": "Missing tenantId",},400);
    }
    let Categories=await dbgetCategories(event.pathParameters.TenantId.toString());
    return formatJSONResponse({Categories}, 200);
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

export const main = middyfy(getAllCategories);
