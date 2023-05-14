import { environment } from 'src/environment/environment';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'text/{TenantId}/{Language}/{Category}/{Title}',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
        cors: true,
      },
    },
  ],
};
