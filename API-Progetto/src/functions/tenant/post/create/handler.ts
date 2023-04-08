import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbputTenant } from 'src/services/dbTenant';

import schema from './schema';

const putTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  /**/
  try {
    /*await dbputTenant({
      id: "1",
      tenantName: event.body.tenantName,
      admins: event.body.admins,
      users: event.body.users,
      creationDate: event.body.creationDate,
      languages: event.body.languages,
      defaultLanguage: event.body.defaultLanguage
    });*/
    return formatJSONResponse({
      message: 'oki'
    });
  } catch (error) {
    return formatJSONResponse({
      message: error,
      event,
    });
  }
};

export const main = middyfy(putTenant);
