import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { createUser } from 'src/services/userManager';

import schema from './schema';

const signUpUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    await createUser({
      username: event.body.email,
      password: event.body.password,
      email: event.body.email,
      role: event.body.group,
      name: event.body.name,
      surname: event.body.surname
    });
    return formatJSONResponse({
      message: `Created user ${event.body.name} from the code, welcome to the exciting SWEG world!`,
      event,
    });
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