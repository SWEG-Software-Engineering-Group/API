import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbgetSecondaryLanguage } from 'src/services/dbTenant';
import schema from './schema';

const getTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let languages=await dbgetSecondaryLanguage(event.pathParameters.tenantid);
  return formatJSONResponse({languages});
};

export const main = middyfy(getTenant);
