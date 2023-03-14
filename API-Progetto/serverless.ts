import type { AWS } from '@serverless/typescript';
import { environment } from 'src/environement/environement';
import hello from '@functions/hello';

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
          TableName: environment.dynamo.userData.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'username',
              AttributeType: 'S',
            },
            {
              AttributeName: 'password',
              AttributeType: 'S',
            },
            {
              AttributeName: 'email',
              AttributeType: 'S',
            },
            {
              AttributeName: 'role',
              AttributeType: 'N',
            },
            {
              AttributeName: 'name',
              AttributeType: 'S',
            },
            {
              AttributeName: 'surname',
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
      tenantTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.tenantTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
            {
              AttributeName: 'tenantName',
              AttributeType: 'S',
            },
            {
              AttributeName: 'admins',
              AttributeType: 'SS',
            },
            {
              AttributeName: 'users',
              AttributeType: 'SS',
            },
            {
              AttributeName: 'creationDate',
              AttributeType: 'S',
            },
            {
              AttributeName: 'languages',
              AttributeType: 'SS',
            },
            {
              AttributeName: 'defaultLanguage',
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
      tokenTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.tokenTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'name',
              AttributeType: 'S',
            },
            {
              AttributeName: 'idTenant',
              AttributeType: 'S',
            },
            {
              AttributeName: 'privileges',
              AttributeType: 'SS',
            },
            {
              AttributeName: 'value',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'name',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'idTenant',
              KeyType: 'RANGE',
            }
          ],
        },
      },
      textCategoryTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.textCategoryTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'idTenant',
              AttributeType: 'S',
            },
            {
              AttributeName: 'idCategory',
              AttributeType: 'S',
            },
            {
              AttributeName: 'textId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'language',
              AttributeType: 'S',
            },
            {
              AttributeName: 'isDefault',
              AttributeType: 'BOOL',
            },
            {
              AttributeName: 'text',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'idTenant',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'idCategory',
              KeyType: 'RANGE',
            },
            {
              AttributeName: 'textId',
              KeyType: 'RANGE',
            },
            {
              AttributeName: 'language',
              KeyType: 'RANGE',
            }
          ],
        },
      },
      textTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: environment.dynamo.textTable.tableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'text',
              AttributeType: 'S',
            },
            {
              AttributeName: 'state',
              AttributeType: 'S',
            },
            {
              AttributeName: 'feedback',
              AttributeType: 'S',
            },
            {
              AttributeName: 'comment',
              AttributeType: 'S',
            },
            {
              AttributeName: 'link',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'text',
              KeyType: 'HASH',
            },
          ],
        },
      },
    },
  },
  // import the function via paths
  functions: { hello },
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
