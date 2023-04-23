import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'text/{TenantId}/{Language}/{Category}/{Title}/text',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};
