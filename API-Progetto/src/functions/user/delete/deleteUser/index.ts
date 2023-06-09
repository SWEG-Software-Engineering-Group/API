import { handlerPath } from '@libs/handler-resolver';
import { environment } from "src/environment/environment";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "delete",
        path: 'user/{Username}/delete',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
        // SET CORS FOR ACCEPT EVERY ORIGIN
        cors: true,
      },
    },
  ],
};
