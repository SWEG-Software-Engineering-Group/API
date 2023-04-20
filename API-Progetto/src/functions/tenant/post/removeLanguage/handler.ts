import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbRemoveSecLanguageFromTenant } from 'src/services/dbTenant';

import schema from './schema';

const removeSecLanguage: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.pathParameters.tenantId == null) {
      return formatJSONResponse(
        {
          "error": "Missing tenantId",
        },
        400
      );
    }
    if (event.body.Language === undefined) {
      return formatJSONResponse(
        {
          "error": "Invalid Body Format",
        },
        400
      );
    }
    let tenant = await dbRemoveSecLanguageFromTenant(event.pathParameters.tenantId, event.body.Language.toString());
    return formatJSONResponse({tenant}, 200);
  } catch (error) {
    console.log(error);
    return formatJSONResponse(
      {
        "error": error,
      },
      400
    );
  }
};

export const main = middyfy(removeSecLanguage);
