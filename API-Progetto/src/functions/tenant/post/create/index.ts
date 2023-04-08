import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';
import { environment } from 'src/environement/environement';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'tenant/create',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
      },
    },
  ],
};
