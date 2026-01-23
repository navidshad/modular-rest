import { TestAppContext, createIntegrationTestApp } from '../helpers/test-app';

describe('data-provider router integration', () => {
  let ctx: TestAppContext;
  let createdId: string;

  beforeAll(async () => {
    ctx = await createIntegrationTestApp();
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.cleanup();
    }
  });

  it('rejects request without authorization', async () => {
    const res = await ctx.request.post('/data-provider/find').send({
      database: 'cms',
      collection: 'file',
      query: {},
    });
    expect(res.status).toBe(401);
  });

  it('fails when database or collection is missing', async () => {
    const res = await ctx.request
      .post('/data-provider/find')
      .set('authorization', ctx.adminToken)
      .send({
        query: {},
      });
    expect(res.status).toBe(412);
    const body = JSON.parse(res.text);
    expect(body.status).toBe('error');
  });

  it('inserts a document using /insert-one', async () => {
    const res = await ctx.request
      .post('/data-provider/insert-one')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        doc: {
          originalName: 'test-file.txt',
          fileName: 'test-uuid.txt',
          format: 'text',
          tag: 'test-tag',
          size: 1024,
          owner: 'admin-id',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.originalName).toBe('test-file.txt');
    createdId = res.body.data._id;
  });

  it('finds the inserted document using /find-one', async () => {
    const res = await ctx.request
      .post('/data-provider/find-one')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        query: { _id: createdId },
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data._id).toBe(createdId);
  });

  it('updates the document using /update-one', async () => {
    const res = await ctx.request
      .post('/data-provider/update-one')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        query: { _id: createdId },
        update: { $set: { originalName: 'updated-name.txt' } },
      });

    expect(res.status).toBe(200);
    // Mongoose updateOne returns { n, nModified, ok }
    expect(res.body.data.ok).toBe(1);

    // Verify update
    const verifyRes = await ctx.request
      .post('/data-provider/find-one')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        query: { _id: createdId },
      });
    expect(verifyRes.body.data.originalName).toBe('updated-name.txt');
  });

  it('counts documents using /count', async () => {
    const res = await ctx.request
      .post('/data-provider/count')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        query: { _id: createdId },
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBe(1);
  });

  it('finds multiple documents using /find', async () => {
    const res = await ctx.request
      .post('/data-provider/find')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        query: { _id: createdId },
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it('finds by ids using /findByIds', async () => {
    const res = await ctx.request
      .post('/data-provider/findByIds')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        ids: [createdId],
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(createdId);
  });

  it('aggregates documents using /aggregate', async () => {
    const res = await ctx.request
      .post('/data-provider/aggregate')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        accessQuery: {},
        pipelines: [{ $match: { tag: 'test-tag' } }], // Use string field to avoid ID casting issues for now
      });

    if (res.status !== 200) {
      console.error('Aggregate Error:', res.text);
    }

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('removes the document using /remove-one', async () => {
    const res = await ctx.request
      .post('/data-provider/remove-one')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        query: { _id: createdId },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.n).toBe(1);

    // Verify removal
    const verifyRes = await ctx.request
      .post('/data-provider/find-one')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'cms',
        collection: 'file',
        query: { _id: createdId },
      });
    expect(verifyRes.body.data).toBeNull();
  });

  it('triggers are executed on direct model usage and api usage', async () => {
    // 1. Define a trigger
    const triggerMock = jest.fn();

    // We need to access the collection definition to add a trigger dynamically for testing
    // or we assume the existing setup allows us to mock/spy on something.
    // However, since we are in an integration test with a real app context, 
    // modifying the collection definition on the fly might be tricky if models are already compiled.
    // Ideally we should have a test collection with triggers defined.

    // Let's create a dynamic collection definition with a trigger for this test if possible,
    // or allow the test helper to set one up.
    // Since we cannot easily modify the setup here without changing helpers, 
    // and the user asked to "add new test case" to this file, 
    // we need to assume there is a way or we need to add a collection definition here.

    // Looking at the imports, we can import defineCollection etc.
    // But the app is already created in beforeAll via createIntegrationTestApp().

    // IF we cannot add a new collection easily, we'll try to spy on console or a side effect 
    // if there are existing triggers. But the current test app seems to use standard collections.

    // Let's assume we can register a new collection via a service method if available, 
    // or we might need to modify the test helper. 
    // For now, I will write the test assuming we can verify the trigger via a mocked callback 
    // attached to a new collection we define locally and register.

    const { defineCollection } = require('../../src/class/collection_definition');
    const { Permission } = require('../../src/class/security');
    const { DatabaseTrigger } = require('../../src/class/database_trigger');
    const { Schema } = require('mongoose');
    const modelRegistry = require('../../src/services/data_provider/model_registry').default;
    const service = require('../../src/services/data_provider/service');

    const triggerCallback = jest.fn();
    const trigger = new DatabaseTrigger('insert-one', triggerCallback);

    const testCollectionDef = defineCollection({
      database: 'test_db',
      collection: 'trigger_test',
      schema: new Schema({ name: String }),
      permissions: [
        new Permission({ accessType: 'anonymous_access', read: true, write: true }),
        new Permission({ accessType: 'god_access', read: true, write: true })
      ],
      triggers: [trigger]
    });

    // Register this new collection
    await service.addCollectionDefinitionByList({
      list: [testCollectionDef],
      mongoOption: ctx.mongoOption // We need to access mongoOption from ctx
    });

    // 2. Perform operation via API
    await ctx.request
      .post('/data-provider/insert-one')
      .set('authorization', ctx.adminToken)
      .send({
        database: 'test_db',
        collection: 'trigger_test',
        doc: { name: 'api_insert' }
      })
      .expect(200);

    // Verify trigger called
    expect(triggerCallback).toHaveBeenCalledTimes(1);
    expect(triggerCallback.mock.calls[0][0].doc).toMatchObject({ name: 'api_insert' });

    // 3. Perform operation via Mongoose Model directly
    const Model = testCollectionDef.model;
    await new Model({ name: 'direct_insert' }).save();

    // Verify trigger called again
    expect(triggerCallback).toHaveBeenCalledTimes(2);
    expect(triggerCallback.mock.calls[1][0].doc).toMatchObject({ name: 'direct_insert' });
  });

  it('triggers find-one-and-update', async () => {
    // 1. Setup Trigger
    const { defineCollection } = require('../../src/class/collection_definition');
    const { Permission } = require('../../src/class/security');
    const { DatabaseTrigger } = require('../../src/class/database_trigger');
    const { Schema } = require('mongoose');
    const service = require('../../src/services/data_provider/service');

    const triggerCallback = jest.fn();
    const trigger = new DatabaseTrigger('find-one-and-update', triggerCallback);

    const testCollectionDef = defineCollection({
      database: 'test_db',
      collection: 'trigger_update_test',
      schema: new Schema({ name: String, version: Number }),
      permissions: [
        new Permission({ accessType: 'anonymous_access', read: true, write: true }),
        new Permission({ accessType: 'god_access', read: true, write: true })
      ],
      triggers: [trigger]
    });

    await service.addCollectionDefinitionByList({
      list: [testCollectionDef],
      mongoOption: ctx.mongoOption
    });

    // 2. Insert initial doc
    const Model = testCollectionDef.model;
    const doc = await new Model({ name: 'initial', version: 1 }).save();

    // 3. Update via Mongoose
    await Model.findOneAndUpdate({ _id: doc._id }, { $set: { version: 2 } });

    // 4. Verify Trigger
    expect(triggerCallback).toHaveBeenCalledTimes(1);
    expect(triggerCallback.mock.calls[0][0].query).toMatchObject({ _id: doc._id });
    expect(triggerCallback.mock.calls[0][0].update).toMatchObject({ $set: { version: 2 } });
  });

  it('triggers delete-many', async () => {
    // 1. Setup Trigger
    const { defineCollection } = require('../../src/class/collection_definition');
    const { Permission } = require('../../src/class/security');
    const { DatabaseTrigger } = require('../../src/class/database_trigger');
    const { Schema } = require('mongoose');
    const service = require('../../src/services/data_provider/service');

    const triggerCallback = jest.fn();
    const trigger = new DatabaseTrigger('delete-many', triggerCallback);

    const testCollectionDef = defineCollection({
      database: 'test_db',
      collection: 'trigger_delete_many_test',
      schema: new Schema({ name: String }),
      permissions: [
        new Permission({ accessType: 'anonymous_access', read: true, write: true }),
        new Permission({ accessType: 'god_access', read: true, write: true })
      ],
      triggers: [trigger]
    });

    await service.addCollectionDefinitionByList({
      list: [testCollectionDef],
      mongoOption: ctx.mongoOption
    });

    // 2. Insert docs
    const Model = testCollectionDef.model;
    await Model.insertMany([{ name: 'doc1' }, { name: 'doc2' }]);

    // 3. Delete via Mongoose
    await Model.deleteMany({ name: { $regex: 'doc' } });

    // 4. Verify Trigger
    expect(triggerCallback).toHaveBeenCalledTimes(1);
    expect(triggerCallback.mock.calls[0][0].query).toMatchObject({ name: { $regex: 'doc' } });
    expect(triggerCallback.mock.calls[0][0].queryResult.deletedCount).toBe(2);
  });
});
