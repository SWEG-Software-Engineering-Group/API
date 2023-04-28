import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbputTenant } from 'src/services/dbTenant';

import schema from './schema';
var crypto = require('crypto');

const addTenant: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try{

  
    if (event.body.tenantName === undefined || event.body.defaultLanguage === undefined || event.body.creationDate === undefined || event.body.languages === undefined || event.body.admins === undefined || event.body.users === undefined || event.body.categories === undefined) {
      return formatJSONResponse(
        {
          "error": "Invalid Body Format",
        },
        400
      );
    }
    await dbputTenant({
      id: crypto.randomUUID(),
      tenantName: event.body.tenantName,
      admins: event.body.admins,
      users: event.body.users,
      creationDate: new Date().getTime()/1000,
      languages: event.body.languages,
      defaultLanguage: event.body.defaultLanguage,
      categories: []//TODO//event.body.categories.map((val) => { return { id: crypto.randomUUID(), name: val } })//TODO map with created id//
    });
    return formatJSONResponse({
      message: `Created tenant ${event.body.tenantName}, welcome to the exciting SWEG world!`,
      event,
    });
  }catch(error){
    console.log(error);
    return formatJSONResponse(
      {
        "error": error,
      },
      400
    );
  }
};

export const main = middyfy(addTenant);
