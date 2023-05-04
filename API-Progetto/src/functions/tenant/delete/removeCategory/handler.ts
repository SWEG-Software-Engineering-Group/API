import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbRemoveCategoryFromTenant } from 'src/services/dbTenant';
import { dbdeleteCategoryTexts } from 'src/services/dbTextCategory';

import schema from './schema';

const removeCategory: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.TenantId == null) {
      return formatJSONResponse(
        {
          "error": "Missing TenantId",
        },
        400
      );
    }
    if (event.pathParameters.Category === undefined) {
      return formatJSONResponse(
        {
          "error": "Invalid Body Format",
        },
        400
      );
    }
    await dbdeleteCategoryTexts(event.pathParameters.TenantId, event.pathParameters.Category);
    let tenant = await dbRemoveCategoryFromTenant(event.pathParameters.TenantId, event.pathParameters.Category.toString());
    return formatJSONResponse({tenant}, 200);
  } catch (error) {
    console.log("uscita da removeCategory con errore", error);
    return formatJSONResponse(
      {
        "error": error.message,
      },
      400
    );
  }
};

export const main = middyfy(removeCategory);
