import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'delete',
            path: 'tenant/{TenantId}/{Language}/language',
      },
    },
  ],
};