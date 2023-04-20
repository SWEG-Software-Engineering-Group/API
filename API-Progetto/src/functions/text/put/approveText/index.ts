import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'put',
        path: 'text/{TenantID}/{language}/{category}/{id}/approveText',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};
