import { mockClient } from "aws-sdk-client-mock";
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";


const ddbMock = mockClient(DynamoDBDocumentClient);
//setup of the test environement
import { ddb } from "../__mocks__/dbConnection";
import { dbpostOriginalText, dbpostTranslation, dbputTextCategory, dbputTranslation, updateText, utilMergeMeta } from "../dbTextCategory";


var crypto = require('crypto');
//mock data for the db
var tenantdata = require("./mockdata/mocktenant1.json");

var TextCategory = require("./mockdata/mockTextCategory.json");

var TextCategoryinfo = require("./mockdata/mockTextInfo.json");
//simpler access to data inside the mock
var lang = TextCategory.language_category_title.split("&")[0].split("<")[1];
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
    ];
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
            await expect(async () => {
                await dbpostOriginalText(tenantdata.id, title, categoryID, "new Text", "comment", "")
            })
                .rejects.toMatchObject({
                    "error": "tenant does not exist",
                });
        });
    });
    describe('dbpostTranslation function ', function () {
        it('tenant doesnt exist', async () => {
            ddbMock.on(GetCommand).resolves({
                Item: tenantdata,
            }).resolvesOnce({
                Item: null,
            });
            await expect(async () => {
                await dbpostTranslation(tenantdata.id, title, categoryID, "new Text", "comment", "")
            }).rejects.toMatchObject({
                "error": "Tenant doesn't exists",
            });
        });
        it('tenant doesnt exist', async () => {
            ddbMock.on(GetCommand).resolves({
                Item: tenantdata,
            }).resolvesOnce({
                Item: TextCategory,
            }).resolvesOnce({
                Item: TextCategoryinfo,
            });
            await expect(async () => {
                await dbpostTranslation(tenantdata.id, title, categoryID, "new Text", "comment", "")
            }).rejects.toThrow();
        });
    });
    describe('dbputTextCategory function ', function () {
        it('correct function', async () => {
            ddbMock.on(ScanCommand).resolvesOnce({
                Items: [TextCategory],
            }).resolvesOnce({
                Items: [TextCategoryinfo],
            });
            ddbMock.on(BatchWriteCommand).resolves({
            });

            await dbputTextCategory(tenantdata.id, categoryID, title, categoryID);

            //expect(result).toBe(true);
        });
    });
    describe('dbputOriginalText function ', function () {
        it('error function', async () => {
            ddbMock.on(GetCommand).resolvesOnce({
                Item: tenantdata,
            }).resolvesOnce({
                Item: TextCategory,
            }).resolvesOnce({
                Item: TextCategoryinfo,
            });

            await expect(async () => {
                await dbputTranslation(tenantdata.id, title, categoryID, lang, TextCategory.text, TextCategory.state);
            }).rejects.toMatchObject({
                "err": {
                    "error": "couldn't collect the categories",
                },
            });
        });
    });
    describe('updateText function ', function () {
        it('correct function', async () => {
            ddbMock.on(GetCommand).resolvesOnce({
                Item: tenantdata,
            });
            await expect(async () => {
                await updateText(tenantdata.id, title, categoryID, lang, TextCategory.text, TextCategory.state);
            }).rejects.toMatchObject({});

        });
    });
});
