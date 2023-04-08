import { handlerPath } from '@libs/handler-resolver';
import { environment } from 'src/environement/environement';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'GET',
        path: 'hello',
        authorizer: {
          arn: environment.cognito.userPoolArn,
        },
      },
    },
  ],
};
