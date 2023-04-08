import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetDefaultLanguage } from 'src/services/dbTenant';


import schema from './schema';

const getDefaultLanguage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let defaultLanguage=await dbgetDefaultLanguage(event.pathParameters.tenantid);
  return formatJSONResponse({defaultLanguage});
};

export const main = middyfy(getDefaultLanguage);
