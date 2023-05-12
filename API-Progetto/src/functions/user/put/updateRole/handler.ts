import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { cgaddUserRole, cggetListUserGroups, cgremoveUserRole } from 'src/services/userManager';

import schema from './schema';

const setRole: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  try {
    // Get User Groups
    let userGroups = await cggetListUserGroups(event.pathParameters.Username);
    // If userGroups.GroupName has the role, return error
    if (userGroups.some((group) => group.GroupName === event.body.Group.toString())) {
      return formatJSONResponse(
        {
          "Error": "User already has this role",
        },
        400
      );
    }

    // Remove all user roles
    userGroups.forEach(async (group) => {
      await cgremoveUserRole(event.pathParameters.Username, group.GroupName);
    });
    // Add new role
    await cgaddUserRole(event.pathParameters.Username, event.body.Group.toString());
    return formatJSONResponse({"Role Updated":"User role sucessfully updated"}, 200);
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

export const main = middyfy(setRole);
