import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { dbputUser } from 'src/services/dynamoUsers';

import schema from './schema';

const createUser: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    try {
        await dbputUser(event.body);
    } catch (e){
        return formatJSONResponse(
            {
              error: e,
              statusCode:500
            }
          );
    }
}

export const main = middyfy(createUser);
