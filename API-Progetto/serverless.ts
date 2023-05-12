import type { AWS } from '@serverless/typescript';
import { environment } from 'src/environment/environment';

// IMPORT USER FUNC
import {
  signUpUser,
  deleteUser,
  getUser,
  getUsers,
  getUserGroups,
  admGetUser,
  getUserTenant,
  //addRole,
  //removeRole,
  setRole,
  getResetCode,
  resetPassword
} from '@functions/index';

// IMPORT TENANT FUNC
import {
  addLanguage,
  //addUserToTenant,
  addTenant,
  removeCategory,
  removeLanguage,
  getAllTenants,
  getTenantLanguages,
  getTenant,
  deleteTenant,
  getAdmins,
  tenantGetUsers,
  getAllCategories,
  getCountLanguagesForCategory
} from '@functions/index';

// IMPORT TEXTCATEGORY FUNC
import {
  deleteText,
  deleteAllTexts,
  getAllTexts,
  getOriginalTexts,
  textOfState,
  // getToBeVerified,
  // getVerified,
  // getToBeTranslated,
  // getRejectedTexts,
  getText,
  getTranslationLanguages,
  postOriginalText,
  putAcceptText,
  putRejectText,
  putOriginalText,
  putTranslation,

} from '@functions/index';
const serverlessConfiguration: AWS = {
  service: 'api-progetto',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline',/*for dynamodblocal*/'serverless-dynamodb-local'],
  provider: {
    region: environment.awsRegion,
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:BatchGetItem",
              "dynamodb:GetItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:BatchWriteItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:Scan",
              "cognito-idp:ListUsers",
              "cognito-idp:AdminConfirmSignUp",
              "cognito-idp:AdminAddUserToGroup",
              "cognito-idp:AdminRemoveUserFromGroup",
              "cognito-idp:AdminGetUser",
              "cognito-idp:AdminDeleteUser",
              "cognito-idp:AdminListGroupsForUser"
            ],
            Resource: [
              environment.dynamo.TenantTable.arn,
              environment.dynamo.TokenTable.arn,
              environment.dynamo.TextCategoryTable.arn,
              environment.dynamo.TextCategoryInfoTable.arn,
              environment.cognito.userPoolArn,
            ],
          },
        ],
      },
    },
  },
  resources: {
    Resources: {
      TokenTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.TokenTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: "idTenant",
              AttributeType: 'S',
            },
            {
              AttributeName: "name",
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'idTenant',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'name',
              KeyType: 'RANGE',
            },
          ],
        },
      },
      TenantTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.TenantTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
        },
      },
      TextCategoryTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.TextCategoryTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'idTenant',
              AttributeType: 'S',
            },
            {
              AttributeName: 'language_category_title',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'idTenant',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'language_category_title',
              KeyType: 'RANGE',
            },
          ],
        },
      },
      TextCategoryinfo: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.TextCategoryInfoTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'idTenant',
              AttributeType: 'S',
            },
            {
              AttributeName: 'language_category_title',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'idTenant',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'language_category_title',
              KeyType: 'RANGE',
            },
          ],
        },
      },
    },
  },
  // import the function via paths
  functions: {
    signUpUser,
    deleteUser,
    getUser,
    getUsers,
    getUserGroups,
    admGetUser,
    getUserTenant,
    //addRole,
    //removeRole,
    setRole,
    getResetCode,
    resetPassword,
    ////
    addLanguage,
    //addUserToTenant,
    addTenant,
    removeCategory,
    removeLanguage,
    getAllTenants,
    getTenantLanguages,
    getTenant,
    deleteTenant,
    getAdmins,
    tenantGetUsers,
    getAllCategories,
    getCountLanguagesForCategory,
    ////
    deleteText,
    deleteAllTexts,
    getAllTexts,
    getOriginalTexts,
    textOfState,
    // getToBeVerified,
    // getVerified,
    // getToBeTranslated,
    // getRejectedTexts,
    getText,
    getTranslationLanguages,
    postOriginalText,
    putAcceptText,
    putRejectText,
    putOriginalText,
    putTranslation,
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    //extra per testare dynamodb in locale
    dynamodb: {
      stages: 'dev',
      start: {
        port: 8000,
        inmemory: true,
        migrate: true,
      }
    },
    webpack: {
      keeoOutputDirectory: true,
    },
  },
};

module.exports = serverlessConfiguration; 