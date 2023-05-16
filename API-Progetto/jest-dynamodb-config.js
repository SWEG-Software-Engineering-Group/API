
module.exports = {
    tables: [
        {
            TableName: "TenantTable",
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
        },
        {
            TableName: "TokenTable",
            KeySchema: [{ AttributeName: 'idTenant', KeyType: 'HASH' }, { AttributeName: 'name', KeyType: 'RANGE' }],
            AttributeDefinitions: [{ AttributeName: 'idTenant', AttributeType: 'S' }, { AttributeName: 'name', AttributeType: 'S' }],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
        },
        {
            TableName: "TextCategoryTable",
            KeySchema: [{ AttributeName: 'idTenant', KeyType: 'HASH' }, { AttributeName: 'language_category_title', KeyType: 'RANGE' }],
            AttributeDefinitions: [{ AttributeName: 'idTenant', AttributeType: 'S' }, { AttributeName: 'language_category_title', AttributeType: 'S' }],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
        },
        {
            TableName: "TextCategoryInfoTable",
            KeySchema: [{ AttributeName: 'idTenant', KeyType: 'HASH' }, { AttributeName: 'language_category_title', KeyType: 'RANGE' }],
            AttributeDefinitions: [{ AttributeName: 'idTenant', AttributeType: 'S' }, { AttributeName: 'language_category_title', AttributeType: 'S' }],
            ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
        },
    ],
};

