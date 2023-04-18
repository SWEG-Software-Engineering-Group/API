import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
    http: {
      method: 'put',
      path: '{TenantId}/{Category}/{Title}/textCategory',
      request: {
        schemas: {
          'application/json': schema,
          },
        },
    },
  ],
};
