import { CognitoIdentityProviderClient} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { environment } from "src/environment/environment";


const CognitoClient = new CognitoIdentityProviderClient({ region: environment.awsRegion });
const CognitoISP = new CognitoIdentityServiceProvider({region: environment.awsRegion});

export { CognitoClient, CognitoISP };