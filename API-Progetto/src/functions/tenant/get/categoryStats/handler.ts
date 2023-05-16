import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetCountLanguagesForCategory } from 'src/services/dbTenant';
import schema from './schema';

const getTenantLanguages: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  //Get the stats of all categories of every category
  //return a list of categories and for every category it contains a list of all 
  //the text languages the texts are translated (+ the original language) present in the category 
  //and the relative count of texts
  try {
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse(
        {
          "Error": "Missing tenantId",
        },
        400
      );
    }
    let languages = await dbgetCountLanguagesForCategory(event.pathParameters.TenantId.toString());
    return formatJSONResponse({ languages }, 200);
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

export const main = middyfy(getTenantLanguages);
