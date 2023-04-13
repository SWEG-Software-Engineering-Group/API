import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { addUserRole } from 'src/services/userManager';
import { getListUserGroups } from 'src/services/userManager';
import { removeUserRole } from 'src/services/userManager';

import schema from './schema';

const setRole: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    // Get User Groups
    let userGroups = await getListUserGroups(event.pathParameters.username);
    // If userGroups.GroupName has the role, return error
    if (userGroups.some((group) => group.GroupName === event.body.group.toString())) {
      return formatJSONResponse(
        {
          "Error": "User already has this role",
        },
        400
      );
    }

    // Remove all user roles
    userGroups.forEach(async (group) => {
      await removeUserRole(event.pathParameters.username, group.GroupName);
    });
    // Add new role
    await addUserRole(event.pathParameters.username, event.body.group.toString());
    return formatJSONResponse({"Role Updated":"User role sucessfully updated"}, 200);
  } catch (error) {
    return formatJSONResponse(
      {
        "Error": error,
      },
      400
    );
  }
};

export const main = middyfy(setRole);
