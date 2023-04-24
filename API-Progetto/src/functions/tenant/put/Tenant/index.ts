import { handlerPath } from '@libs/handler-resolver';
import { environment } from "src/environment/environment";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "PUT",
        path: 'tenant/{TenantId}/reset',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
      },
    },
  ],
};
