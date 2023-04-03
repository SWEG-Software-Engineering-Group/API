import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: '{TenantID}/{language}/{textCategory}/{textId}/searchTextsById',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
      },
    },
  ],
};
