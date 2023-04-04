import type { AWS } from '@serverless/typescript';
import { environment } from 'src/environement/environement';
import hello from '@functions/hello';
import { putTenant, getTenantAdmins, getTenantUsers, getUserInfo, getAllTexts, getText, getTextFromCategory, getTextFromLanguage } from '@functions/index';

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
      TextInfoTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.TextInfoTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'idTenant',
              AttributeType: 'S',
            },
            {
              AttributeName: 'categoryIdtextId',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'idTenant',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'categoryIdtextId',
              KeyType: 'RANGE',
            },
          ],
        },
          },
      TextTable: {
          Type: 'AWS::DynamoDB::Table',
          Properties: {
              TableName: environment.dynamo.TextTable.tableName,
              BillingMode: 'PAY_PER_REQUEST',
              AttributeDefinitions: [
                  {
                      AttributeName: 'idTenant',
                      AttributeType: 'S',
                  },
                  {
                      AttributeName: 'languagetextId',
                      AttributeType: 'S',
                  },
              ],
              KeySchema: [
                  {
                      AttributeName: 'idTenant',
                      KeyType: 'HASH',
                  },
                  {
                      AttributeName: 'languagetextId',
                      KeyType: 'RANGE',
                  },
              ],
          },
      },
    },
  },
  // import the function via paths
  functions: { hello, putTenant, getTenantAdmins, getTenantUsers, getUserInfo, getAllTexts, getTextFromCategory, getTextFromLanguage, getText },
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
