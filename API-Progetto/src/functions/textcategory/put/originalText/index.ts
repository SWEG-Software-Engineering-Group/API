import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';
import { environment } from 'src/environment/environment';
export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'put',
        path: 'text/{TenantId}/category/{Category}/{Title}/editOriginalText',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};
