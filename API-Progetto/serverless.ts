import type { AWS } from '@serverless/typescript';
import { environment } from 'src/environment/environment';

// IMPORT USER FUNC
import {
  signUpUser,
  getUsers,
  adminGetUser,
  getUserGroups,
  addRole,
  removeRole,
  setRole,
  getUserTenant,
  deleteUser,
  getUser
} from '@functions/index';

// IMPORT TENANT FUNC
import {
  resetTenant,
  addTenantAdmin,
  addCategory,
  addLanguage,
  addUserToTenant,
  addTenant,
  removeTenantAdmin,
  removeTenantUser,
  removeCategory,
  removeLanguage,
  getTenantAdmins,
  getTenantUsers,
  getAllTenants,
  getTenantLanguages,
  getTenant,
  getDefaultLanguage,
  deleteLanguage,
  deleteTenant
} from '@functions/index';

// IMPORT TEXTCATEGORY FUNC
import {
  deleteText,
  getCategories,
  getAllTexts,
  getOriginalTexts,
  getTextToVerify,
  getRejectedText,
  getText,
  getTexts,
  getTextCategory,
  getTextFromLanguage,
  getTextFromCategory,
  getTranslationLanguages,
  getUntranslatedTexts,
  postOriginalText,
  postTranslation,
  putAcceptText,
  putRejectText,
  putOriginalText,
  putTextCategory,
  putTranslation
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
      getUsers,
      adminGetUser,
      getUserGroups,
      addRole,
      removeRole,
      setRole,
      getUserTenant,
      deleteUser,
      getUser,
      ////
      resetTenant,
      addTenantAdmin,
      addCategory,
      addLanguage,
      addUserToTenant,
      addTenant,
      removeTenantAdmin,
      removeTenantUser,
      removeCategory,
      removeLanguage,
      getTenantAdmins,
      getTenantUsers,
      getAllTenants,
      getTenantLanguages,
      getTenant,
      getDefaultLanguage,
      deleteLanguage,
      deleteTenant,
      ////
      deleteText,
      getCategories,
      getAllTexts,
      getOriginalTexts,
      getTextToVerify,
      getRejectedText,
      getText,
      getTexts,
      getTextCategory,
      getTextFromLanguage,
      getTextFromCategory,
      getTranslationLanguages,
      getUntranslatedTexts,
      postOriginalText,
      postTranslation,
      putAcceptText,
      putRejectText,
      putOriginalText,
      putTextCategory,
      putTranslation
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
