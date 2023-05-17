import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";


const ddbMock = mockClient(DynamoDBDocumentClient);
//setup of the test environement
import { ddb } from "../__mocks__/dbConnection";
import { dbpostOriginalText, utilMergeMeta } from "../dbTextCategory";


var crypto = require('crypto');
//mock data for the db
var tenantdata = require("./mockdata/mocktenant1.json");

var TextCategory = require("./mockdata/mockTextCategory.json");

var TextCategoryinfo = require("./mockdata/mockTextInfo.json");
//simpler access to data inside the mock
// var lang = TextCategory.language_category_title.split("&")[0].split("<")[1];
var categoryID = TextCategory.language_category_title.split("'")[0].split("&")[1];
var title = TextCategory.language_category_title.split(">")[0].split("'")[1];
//create e credible UUID
tenantdata.id = crypto.randomUUID();
TextCategory.idTenant = tenantdata.id;
TextCategoryinfo.idTenant = tenantdata.id;

beforeAll(async () => {
    tenantdata.categories = [
        {
            id: categoryID,
            name: tenantdata.categories[0]
        }
    ]
    await ddb
        .put({ TableName: 'TenantTable', Item: tenantdata })
        .promise();
    await ddb
        .put({ TableName: 'TextCategoryTable', Item: TextCategory })
        .promise();
    await ddb
        .put({ TableName: 'TextCategoryInfoTable', Item: TextCategoryinfo })
        .promise();
}, 100000)
beforeEach(async () => {
    ddbMock.reset();
});

describe('dbTextCategory file', function () {

    describe('utilMergeMeta function ', function () {
        it('user is in tenant', async () => {

            let result = await utilMergeMeta(TextCategory, [TextCategoryinfo], tenantdata.categories);
            expect(result.idTenant).toBe(tenantdata.id);
            expect(result.language).toBe("English");
            expect(result.state).toBe(TextCategory.state);
        });
    });

    describe('dbpostOriginalText function ', function () {
        it('tenant doesnt exist', async () => {
            ddbMock.on(GetCommand).resolves({
                Item: tenantdata,
            }).resolves({
                Item: null,
            });
            try {
                await dbpostOriginalText(tenantdata.id, title, categoryID, "new Text", "comment", "");
                expect(true).toBe(false);
            } catch (error) {
                expect(true).toBe(true);
            }
        });
    });
});
