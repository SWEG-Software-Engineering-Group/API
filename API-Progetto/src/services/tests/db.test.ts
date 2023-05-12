import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbMock = mockClient(DynamoDBDocumentClient);

import { dbcheckAdminInTenant, dbcheckUserInTenant, dbgetCategories, dbgetCountLanguagesForCategory, dbgetDefaultLanguage, dbgetSecondaryLanguages, dbgetTenantinfo, dbgetTenants, dbgetUserTenant, dbputTenant } from "../dbTenant";
import { ddb } from "../__mocks__/dbConnection";
var crypto = require('crypto');

var tenantdata1 = require("./mockdata/mocktenant1.json");
tenantdata1.id = crypto.randomUUID();
var tenantdata2 = require("./mockdata/mocktenant2.json");
tenantdata2.id = crypto.randomUUID();
beforeAll(async () => {
    await ddb
        .put({ TableName: 'TenantTable', Item: tenantdata1 })
        .promise();
    await ddb
        .put({ TableName: 'TenantTable', Item: tenantdata2 })
        .promise();
}, 100000)
beforeEach(async () => {
    ddbMock.reset();
});

describe('dbTenant file', function () {
    describe('dbcheckUserInTenant function ', function () {
        beforeEach(async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: Item,
            });
        });
        it('user is in tenant', async () => {
            const isPresent = await dbcheckUserInTenant(tenantdata1.id, tenantdata1.users[0]);

            expect(isPresent).toBe(true);

        });
        it('user is admin in tenant', async () => {
            const isPresent = await dbcheckUserInTenant(tenantdata1.id, tenantdata1.admins[0]);

            expect(isPresent).toBe(true);
        });
        it('user is not in tenant', async () => {
            const isPresent = await dbcheckUserInTenant(tenantdata1.id, "paperino");

            expect(isPresent).toBe(false);
        });
        // it('db throws error', async () => {
        //     ddbMock.reset();
        //     ddbMock.on(GetCommand).rejects("error");

        //     expect(async () => {
        //         await dbcheckUserInTenant(tenantdata1.id, "paperino")
        //     }).toThrow();

        // });
    });
    describe('dbcheckAdminInTenant function ', function () {
        beforeEach(async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: Item,
            });
        });

        it('user is not admin in tenant', async () => {
            const isPresent = await dbcheckAdminInTenant(tenantdata1.id, "pippo");

            expect(isPresent).toBe(false);
        });
        it('user is admin in tenant', async () => {
            const isPresent = await dbcheckAdminInTenant(tenantdata1.id, "pluto");

            expect(isPresent).toBe(true);
        });
        it('user is not in tenant', async () => {
            const isPresent = await dbcheckAdminInTenant(tenantdata1.id, "paperino");

            expect(isPresent).toBe(false);
        });
    });
    describe('dbgetTenants function ', function () {
        beforeEach(async () => {
            const { Items } = await ddb.scan({ TableName: 'TenantTable' }).promise()
            ddbMock.on(ScanCommand).resolves({
                Items: Items,
            });

        });

        it('check 2 items in tenanttable', async () => {
            const tenants = await dbgetTenants();

            expect(tenants.tenants.toString()).toContain(tenantdata1.toString());
            expect(tenants.tenants.toString()).toContain(tenantdata2.toString());
            expect(Object.keys(tenants.tenants).length).toBe(2);
        });
    });
    describe('dbgetTenantinfo function ', function () {
        beforeEach(async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: Item,
            });
        });

        it('tenant present', async () => {
            const tenant = await dbgetTenantinfo("tenant1");

            expect(tenant).toStrictEqual(tenantdata1);
        });
    });
    describe('dbgetUserTenant function ', function () {
        beforeEach(async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(ScanCommand).resolves({
                Items: Item,
            });
        });

        it('tenant present', async () => {
            const tenant = await dbgetUserTenant(tenantdata1.users[0]);

            expect(tenant).toStrictEqual(tenantdata1);
        });
    });
    describe('dbgetUserTenant function ', function () {

        it('user has tenant present', async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(ScanCommand).resolves({
                Items: Item,
            });
            const tenant = await dbgetUserTenant(tenantdata1.users[0]);

            expect(tenant).toStrictEqual(tenantdata1);
        });
        it('user doesnt have any tenant', async () => {
            // const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(ScanCommand).resolves({
                Items: [],
            });
            const tenant = await dbgetUserTenant(tenantdata1.users[0]);

            expect(tenant).toStrictEqual([]);
        });
    });
    describe('dbgetTenantUsers function ', function () {

        //TODO try and mock the cognito user pool
    });
    describe('dbgetDefaultLanguage function ', function () {

        it('correct tenant', async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: Item,
            });
            const tenant = await dbgetDefaultLanguage(tenantdata1.id);

            expect(tenant).toStrictEqual(tenantdata1.defaultLanguage);
        });
        it('wrong tenant', async () => {
            // const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: crypto.randomUUID() } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: null,
            });
            //TODO fix with jest to throw
            try {
                await dbgetDefaultLanguage(tenantdata1.id);
                expect(true).toBe(false);
            } catch (error) {
                expect(true).toBe(true);
            }

        });
    });
    describe('dbgetSecondaryLanguages function ', function () {

        it('correct tenant', async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: Item,
            });
            const tenant = await dbgetSecondaryLanguages(tenantdata1.id);

            expect(tenant).toStrictEqual(tenantdata1.languages);
        });
        it('wrong tenant', async () => {
            // const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: crypto.randomUUID() } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: null,
            });
            //TODO fix with jest to throw
            try {
                await dbgetSecondaryLanguages(tenantdata1.id);
                expect(true).toBe(false);
            } catch (error) {
                expect(true).toBe(true);
            }

        });
    });
    describe('dbgetCategories function ', function () {

        it('categories in tenant', async () => {
            const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: Item,
            });
            const tenant = await dbgetCategories(tenantdata1.id);

            expect(tenant).toStrictEqual(tenantdata1.categories);
        });
        it('wrong tenant', async () => {
            // const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: crypto.randomUUID() } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: null,
            });
            //TODO fix with jest to throw
            try {
                await dbgetSecondaryLanguages(tenantdata1.id);
                expect(true).toBe(false);
            } catch (error) {
                expect(true).toBe(true);
            }

        });
    });
    describe('dbgetCountLanguagesForCategory function ', function () {
        //TODO better test 
        it('', async () => {

        });
        it('wrong tenant', async () => {
            // const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: crypto.randomUUID() } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: null,
            });
            //TODO fix with jest to throw
            try {
                await dbgetCountLanguagesForCategory(tenantdata1.id);
                expect(true).toBe(false);
            } catch (error) {
                expect(true).toBe(true);
            }

        });
    });
    describe('dbdeleteTenant function ', function () {
        //TODO control side effects on cgdelete
        it('wrong tenant', async () => {
            // const { Item } = await ddb.get({ TableName: 'TenantTable', Key: { id: crypto.randomUUID() } }).promise()
            ddbMock.on(GetCommand).resolves({
                Item: null,
            });
            //TODO fix with jest to throw
            try {
                await dbgetSecondaryLanguages(tenantdata1.id);
                expect(true).toBe(false);
            } catch (error) {
                expect(true).toBe(true);
            }

        });
    });
    describe('dbputTenant function ', function () {
        //TODO control side effects on cgdelete
        it('wrong tenant', async () => {
            // const { Item } = 
            ddbMock.on(PutCommand).callsFakeOnce(async () => {
                tenantdata1.tenantName = "putTest";
                await ddb.put({ TableName: 'TenantTable', Item: tenantdata1 }).promise()
            });

            let changedtenant1 = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            expect(changedtenant1.Item.toString()).toBe(tenantdata1);
            await dbputTenant(tenantdata1.id);
            let changedtenant = await ddb.get({ TableName: 'TenantTable', Key: { id: tenantdata1.id } }).promise()
            expect(changedtenant.Item.toString()).toBe(tenantdata1);

        });
    });
});

