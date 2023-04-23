import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'GET',
        path: 'text/{TenantID}/{Language}/pendingTranslations',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};
