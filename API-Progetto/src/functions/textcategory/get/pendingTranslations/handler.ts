import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { textsOfState } from 'src/services/dbTextCategory';
import { TextCategory, state } from 'src/types/TextCategory';

import schema from './schema';

const getTextsToVerify: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  var res: TextCategory[] = null;
  try {
    res = await textsOfState(event.pathParameters.TenantID, event.pathParameters.language, state.daVerificare);
  } catch {
    return formatJSONResponse({ "error": "error" }, 403);
  }
  return formatJSONResponse({ "texts": res });
};

export const main = middyfy(getTextsToVerify);
