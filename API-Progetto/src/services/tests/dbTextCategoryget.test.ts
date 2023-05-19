import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";


const ddbMock = mockClient(DynamoDBDocumentClient);
//setup of the test environement
import { ddb } from "../__mocks__/dbConnection";

import { state } from "../../types/TextCategory";
import { dbgetAllTexts, dbgetSingleText, dbgetTexts, textsOfState } from "../dbTextCategoryGet";
import { utilMergeMeta } from "../dbTextCategory";
import { title } from "process";

var crypto = require('crypto');
//mock data for the db
var tenantdata = require("./mockdata/mocktenant1.json");

var TextCategory = require("./mockdata/mockTextCategory.json");

var TextCategoryinfo = require("./mockdata/mockTextInfo.json");
//simpler access to data inside the mock
var lang = TextCategory.language_category_title.split("&")[0].split("<")[1];
var categoryID = TextCategory.language_category_title.split("'")[0].split("&")[1];
// var title = TextCategory.language_category_title.split(">")[0].split("'")[1];
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


    describe('dbgetAllTexts function ', function () {
        it('all texts is in tenant', async () => {
            const { text } = await ddb.scan({ TableName: 'TextCategoryTable', Key: { id: tenantdata.id } }).promise()
            const { textinfo } = await ddb.scan({ TableName: 'TextCategoryInfoTable', Key: { id: tenantdata.id } }).promise()
            ddbMock.on(QueryCommand).resolvesOnce({
                Items: [text],
            });
            ddbMock.on(QueryCommand).resolvesOnce({
                Items: [textinfo],
            });
            try {
                await dbgetAllTexts(tenantdata.id);
            } catch {

            }

        });
    });

    describe('dbgetTexts function ', function () {
        it('all texts is in tenant', async () => {
            ddbMock.on(GetCommand).resolves({
                Item: tenantdata,
            });
            ddbMock.on(QueryCommand).resolvesOnce({
                Items: [TextCategory],
            }).resolvesOnce({
                Items: [TextCategoryinfo],
            });
            let result = await dbgetTexts(tenantdata.id, lang, categoryID);
            //expect(result[0]).toBe(utilMergeMeta(text, textinfo, tenantdata.categories));
            expect(result.length).toBe(1);
        });
        it('categories not found', async () => {
            ddbMock.on(GetCommand).resolves({
                Item: null,
            });
            try {
                await dbgetTexts(tenantdata.id, lang, categoryID);
                expect(true).toBe(false);
            } catch (error) {
                expect(true).toBe(true);
            }


        });
    });

    describe('tenant doesnt exist', function () {
        it('text is not in tenant', async () => {
            ddbMock.on(GetCommand).resolvesOnce({
                Item: null,
            });
            await expect(async () => {
                await dbgetSingleText(tenantdata.id, lang, categoryID, title);
            }).rejects.toMatchObject({});
            //let result = await dbgetSingleText(tenantdata.id, lang, categoryID, title);
            //expect(result[0]).toStrictEqual(utilMergeMeta(TextCategory, [TextCategoryinfo], tenantdata.categories));
        });
    });
    describe('category doesnt exist', function () {
        it('text is not in tenant', async () => {
            ddbMock.on(GetCommand).resolvesOnce({
                Item: tenantdata,
            }).resolvesOnce({
                Item: null,
            });
            await expect(async () => {
                await dbgetSingleText(tenantdata.id, lang, categoryID, title);
            }).rejects.toMatchObject({});
            //let result = await dbgetSingleText(tenantdata.id, lang, categoryID, title);
            //expect(result[0]).toStrictEqual(utilMergeMeta(TextCategory, [TextCategoryinfo], tenantdata.categories));
        });
    });
    describe('undefined', function () {
        it('text is not in tenant', async () => {
            ddbMock.on(GetCommand).resolvesOnce({
                Item: tenantdata,
            }).resolvesOnce({
                Item: tenantdata,
            }).resolvesOnce({
                Item: TextCategory,
            }).resolvesOnce({
                Item: TextCategoryinfo,
            });
            let result = await dbgetSingleText(tenantdata.id, lang, categoryID, title);
            expect(result[0]).toBe(undefined);
        });
    });

    describe('textsOfState function ', function () {
        it('text is in tenant', async () => {
            ddbMock.on(GetCommand).resolves({
                Item: tenantdata,
            });
            ddbMock.on(QueryCommand).resolvesOnce({
                Items: [TextCategory],
            }).resolvesOnce({
                Items: [TextCategoryinfo],
            });
            let result = await textsOfState(tenantdata.id, lang, state.daTradurre);
            expect(result[0]).toStrictEqual(utilMergeMeta(TextCategory, [TextCategoryinfo], tenantdata.categories));
        });
    });

});