import type { AWS } from '@serverless/typescript';
import { environment } from 'src/environment/environment';
import { hello, putTenant, getTenants, getTenant, getDefaultLanguage, getSecondaryLanguage, deleteTenants, resetTenant } from '@functions/index';


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
            ],
            Resource: [
              environment.dynamo.UserTable.arn,
              environment.dynamo.TenantTable.arn,
              environment.dynamo.TokenTable.arn,
              environment.dynamo.TextCategoryTable.arn,
            ],
          },
        ],
      },
    },
  },
  resources: {
    Resources: {
      userTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.UserTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'username',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'username',
              KeyType: 'HASH',
            },
          ],
        },
      },
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
              AttributeName: 'languageidCategorytextId',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'idTenant',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'languageidCategorytextId',
              KeyType: 'RANGE',
            },
          ],
        },
      },
    },
  },
  // import the function via paths
  functions: {hello, putTenant, getTenants, getTenant, getDefaultLanguage, getSecondaryLanguage, deleteTenants, resetTenant },
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
    }
  },
};

module.exports = serverlessConfiguration; 
