import { handlerPath } from '@libs/handler-resolver';
import { environment } from "src/environment/environment";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "delete",
        path: 'tenant/{tenantId}/delete',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
      },
    },
  ],
};
