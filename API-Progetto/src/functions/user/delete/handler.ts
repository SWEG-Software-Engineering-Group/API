import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { deleteUser } from 'src/services/userManager';


import schema from './schema';

const delUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    try {
      await deleteUser(event.pathParameters.userId);
      return formatJSONResponse({}, 200);
    } catch (error) {
      return formatJSONResponse(
        {
          error,
        },
        400
      );
    }
  
};

export const main = middyfy(delUser);
