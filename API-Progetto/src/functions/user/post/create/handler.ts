import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgcreateUser } from 'src/services/userManager';
import { dbAddUserToTenant, dbAddAdminToTenant } from 'src/services/dbTenant';

import schema from './schema';

const signUpUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    if (event.body.Email === undefined || event.body.Password === undefined || event.body.Group === undefined || event.body.Name === undefined || event.body.Surname === undefined) {
      return formatJSONResponse(
        {
          "error": "Invalid Body Format",
        },
        400
      );
    }
    let user = await cgcreateUser({
      username: event.body.Email,
      password: event.body.Password,
      email: event.body.Email,
      role: event.body.Group,
      name: event.body.Name,
      surname: event.body.Surname
    });
    if (event.body.Group === "admin") {
      await dbAddAdminToTenant(event.pathParameters.TenantId, user.Username);
    } else {
      await dbAddUserToTenant(event.pathParameters.TenantId, user.Username);
    }
    return formatJSONResponse({ user });
  } catch (error) {
    return formatJSONResponse(
      {
        "Error": error,
      },
      400
    );
  }

};

export const main = middyfy(signUpUser);
