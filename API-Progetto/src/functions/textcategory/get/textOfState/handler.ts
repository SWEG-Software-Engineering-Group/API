import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { textsOfState } from 'src/services/dbTextCategory';
import { state } from 'src/types/TextCategory';
import { Text } from 'src/types/Text';
import sanitizeHtml from 'sanitize-html';
import schema from './schema';
import { dbcheckUserInTenant, dbgetTenantinfo } from 'src/services/dbTenant';

const textOfState: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  let currentstate: state = null;
  let status = sanitizeHtml(event.pathParameters.status, { allowedTags: [], allowedAttributes: {} });
  switch (status) {
    case "rejectedTexts":
      //TODO verifica permessi
      currentstate = state.rifiutato
      break;
    case "toBeTranslated":
      //TODO verifica permessi
      currentstate = state.daTradurre
      break;
    case "verified":
      //TODO verifica permessi
      currentstate = state.verificato
      break;
    case "toBeVerified":
      //TODO verifica permessi
      currentstate = state.daVerificare
      break;
    default:
      return formatJSONResponse({ "error": "page not found" }, 400);
  }

  let tenant = sanitizeHtml(event.pathParameters.TenantId, { allowedTags: [], allowedAttributes: {} });
  let language = sanitizeHtml(event.pathParameters.Language, { allowedTags: [], allowedAttributes: {} });
  var result: Text[] = null;
  try {
    //TODO check user is admin inside this tenant
    if (false)
      if (dbcheckUserInTenant(tenant, "Username"))
        return formatJSONResponse({ "error": "user not in this tenant" }, 400);

    if (tenant == "")
      return formatJSONResponse({ "error": "Missing TenantID" }, 400);
    if (language == "")
      return formatJSONResponse({ "error": "Missing Language" }, 400);
    if (await dbgetTenantinfo(tenant) == null) {
      return formatJSONResponse({ "error": "tenant doesnt exist" }, 400);
    }

    result = await textsOfState(tenant, language, currentstate);
  } catch (e) {
    return formatJSONResponse({ "error": e }, 403);
  }
  return formatJSONResponse({ "texts": result });
};
export const main = middyfy(textOfState);
