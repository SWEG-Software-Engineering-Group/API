import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgresetPassword } from 'src/services/userManager';


import schema from './schema';

const resetPassword: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.body.Username === undefined || event.body.Code === undefined || event.body.Password === undefined) {
      return formatJSONResponse(
        {
          "error": "Invalid Body Format",
        },
        400
      );
    }
    let user = await cgresetPassword(event.body.Username, event.body.Code, event.body.Password);
    return formatJSONResponse({ user });
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

export const main = middyfy(resetPassword);
