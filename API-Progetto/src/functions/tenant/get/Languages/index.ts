import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'tenant/{TenantId}/languages',
        cors: true,
        apiKeyRequired: true
      },
    },
  ],
};
