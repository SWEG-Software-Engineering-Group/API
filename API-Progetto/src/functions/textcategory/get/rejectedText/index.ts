import { environment } from 'src/environment/environment';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'GET',
        path: 'text/{TenantId}/{Language}/rejectedTexts',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
      },
    },
  ],
};
