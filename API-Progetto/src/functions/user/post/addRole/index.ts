import { handlerPath } from '@libs/handler-resolver';
import schema from './schema';
import { environment } from "src/environment/environment";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'user/{Username}/addRole',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
        authorizer: {
          arn: environment.cognito.userPoolArn,
        }
      },
    },
  ],
};
