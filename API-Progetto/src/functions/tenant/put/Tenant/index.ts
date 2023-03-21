import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "PUT",
        path: 'tenant/{tenantId}/reset',
      },
    },
  ],
};
