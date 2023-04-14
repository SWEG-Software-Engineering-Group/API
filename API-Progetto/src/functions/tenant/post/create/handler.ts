import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbputTenant } from 'src/services/dbTenant';

import schema from './schema';
var crypto = require('crypto');

const putTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  await dbputTenant({
    id: crypto.randomUUID(),
    tenantName: event.body.tenantName,
    admins: event.body.admins,
    users: event.body.users,
    creationDate: event.body.creationDate,
    languages: event.body.languages,
    defaultLanguage: event.body.defaultLanguage,
    categories: []//TODO//event.body.categories.map((val) => { return { id: crypto.randomUUID(), name: val } })//TODO map with created id//
  });
  return formatJSONResponse({
    message: `Created tenant ${event.body.tenantName}, welcome to the exciting SWEG world!`,
    event,
  });
};

export const main = middyfy(putTenant);
