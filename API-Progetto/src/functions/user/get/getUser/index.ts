import { handlerPath } from '@libs/handler-resolver';
import { environment } from "src/environment/environment";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'user/usertoken/{AccessToken}',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
        cors: true,
      },
    },
  ],
};
