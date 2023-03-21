import {
  formatJSONResponse,
} from "@libs/api-gateway";

type UseType = "admin" | "viewer";
interface AuthAttributes {
  userType: UseType;
  userMail: string;
}

const authorizer = (
  handler: (event: any, context: any, callback: any) => void,
  scopes: UseType[]
) => {
  return (event, context, callback) => {
    const attributes = event.requestContext.authorizer.claims;
    const authAttributes: AuthAttributes = {
      userType: attributes["cognito:groups"],
      userMail: attributes.email,
    };
    event.attributes = authAttributes;

    if (!scopes.includes(authAttributes.userType))
      return formatJSONResponse(
        {
          message: "User has not got the required role for this action",
        },
        403
      );
    else {
      return handler(event, context, callback);
    }
  };
};

export { AuthAttributes, authorizer, UseType };
