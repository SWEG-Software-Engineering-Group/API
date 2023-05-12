import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetDefaultLanguage } from 'src/services/dbTenant';


import schema from './schema';

const getDefaultLanguage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    const defaultLanguage=await dbgetDefaultLanguage(event.pathParameters.tenantid);
    return formatJSONResponse({defaultLanguage},200);
  } catch (error) {
    return formatJSONResponse(
      { error },
      400 );
  }
};

export const main = middyfy(getDefaultLanguage);
