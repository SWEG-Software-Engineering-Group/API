import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'put',
        path: '{TenantID}/{language}/{textCategory4}/{textId}/approveText',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};
