import { AccessTypes } from '../../class/security';
import Router from 'koa-router';
import { validateObject } from '../../class/validator';
import { create as reply } from '../../class/reply';
import nestedProperty from 'nested-property';
import * as service from './service';
import * as middleware from '../../middlewares';
import { Context, Next } from 'koa';
import mongoose from 'mongoose';

const name = 'data-provider';

const dataProvider = new Router();

dataProvider.use('/', middleware.auth, async (ctx: Context, next: Next) => {
  const body = ctx.request.body;
  const bodyValidated = validateObject(body, 'database collection');

  // fields validation
  if (!bodyValidated.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidated.requires })));
  }

  // type caster
  if (body.types && body.hasOwnProperty(body.bodyKey || '.')) {
    const bodyKey = body.bodyKey;
    for (const key in body.types) {
      if (body.types.hasOwnProperty(key) && typeof body.types[key] == 'object') {
        const typeDetail = body.types[key];

        try {
          const value = nestedProperty.get(body[bodyKey], typeDetail.path);
          const newProperty =
            service.TypeCasters[typeDetail.type as keyof typeof service.TypeCasters](value);
          nestedProperty.set(body[bodyKey], typeDetail.path, newProperty);
          console.log('newProperty', newProperty, JSON.stringify(body[bodyKey]));
        } catch (e) {
          console.log('type caster error', e);
        }
      }
    }
  }

  await next();
});

dataProvider.post('/find', async (ctx: Context) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection query');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.read,
    body.query,
    ctx.state.user
  );
  if (!hasAccess) {
    console.log(body);
    console.log(ctx.state.user.permission);
    ctx.throw(403, 'access denied');
  }

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  // operate on db
  let queryRequest = collection.find(body.query, body.projection);

  if (body.options) {
    queryRequest = service.performAdditionalOptionsToQueryObject(queryRequest, body.options);
  }

  if (body.populates) {
    try {
      queryRequest = service.performPopulateToQueryObject(queryRequest, body.populates);
    } catch (err) {
      ctx.status = 412;
      ctx.body = err;
    }
  }

  await queryRequest
    .exec()
    .then(async docs => {


      ctx.body = { data: docs };
    })
    .catch(err => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    });
});

dataProvider.post('/find-one', async (ctx: Context) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection query');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.read,
    body.query,
    ctx.state.user
  );
  if (!hasAccess) ctx.throw(403, 'access denied');

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  // operate on db
  let queryRequest = collection.findOne(body.query, body.projection, body.options);

  if (body.options) {
    queryRequest = service.performAdditionalOptionsToQueryObject(queryRequest, body.options);
  }

  if (body.populates) {
    try {
      queryRequest = service.performPopulateToQueryObject(queryRequest, body.populates);
    } catch (err) {
      ctx.status = 412;
      ctx.body = err;
    }
  }

  // operate on db
  await queryRequest
    .exec()
    .then(async doc => {


      ctx.body = { data: doc };
    })
    .catch(err => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    });
});

dataProvider.post('/count', async (ctx: Context) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection query');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.read,
    body.query,
    ctx.state.user
  );
  if (!hasAccess) ctx.throw(403, 'access denied');

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  await collection
    .countDocuments(body.query)
    .exec()
    .then(count => {


      ctx.body = { data: count };
    })
    .catch(err => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    });
});

dataProvider.post('/update-one', async (ctx: Context) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection query update');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.write,
    body.query,
    ctx.state.user
  );
  if (!hasAccess) ctx.throw(403, 'access denied');

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  // get removing doc as output for triggers
  const output: any = await collection.findOne(body.query).exec().then();

  // operate on db
  await collection
    .updateOne(body.query, body.update, body.options)
    .exec()
    .then(writeOpResult => {


      ctx.body = { data: writeOpResult };
    })
    .catch(err => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    });
});

dataProvider.post('/insert-one', async (ctx: Context) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection doc');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.write,
    body.doc,
    ctx.state.user
  );
  if (!hasAccess) {
    console.log(body);
    console.log(ctx.state.user.permission);
    ctx.throw(403, 'access denied');
  }

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  // operate on db
  await new collection(body.doc)
    .save()
    .then(async newDoc => {


      ctx.body = { data: newDoc };
    })
    .catch(err => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    });
});

dataProvider.post('/remove-one', async (ctx: Context) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection query');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.write,
    body.query,
    ctx.state.user
  );
  if (!hasAccess) ctx.throw(403, 'access denied');

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  // get removing doc as output for triggers
  const output: any = await collection.findOne(body.query).exec().then();

  // operate on db
  await collection
    .deleteOne(body.query)
    .exec()
    .then(async (result: any) => {


      ctx.body = { data: result };
    })
    .catch((err: Error) => {
      ctx.status = (err as any).status || 500;
      ctx.body = err.message;
    });
});

dataProvider.post('/aggregate', async (ctx: Context) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection accessQuery');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.read,
    body.accessQuery,
    ctx.state.user
  );
  if (!hasAccess) ctx.throw(403, 'access denied');

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  // operate on db
  await collection
    .aggregate(body.pipelines)
    .exec()
    .then(async (result: any) => {


      ctx.body = { data: result };
    })
    .catch((err: any) => {
      ctx.status = err.status || 500;
      ctx.body = err.message;
    });
});

dataProvider.post('/findByIds', async (ctx: Context, next: Next) => {
  const body = ctx.request.body;
  const bodyValidate = validateObject(body, 'database collection ids');

  // fields validation
  if (!bodyValidate.isValid) {
    ctx.throw(412, JSON.stringify(reply('e', { error: bodyValidate.requires })));
  }

  // access validation
  const hasAccess = service.checkAccess(
    body.database,
    body.collection,
    AccessTypes.read,
    body.accessQuery || {},
    ctx.state.user
  );
  if (!hasAccess) ctx.throw(403, 'access denied');

  // collection validation
  const collection = service.getCollection(body.database, body.collection);
  if (collection == null) {
    ctx.throw(412, JSON.stringify(reply('e', { error: 'wrong database or collection' })));
  }

  const or: Array<{ _id: any }> = [];

  try {
    body.ids.forEach((id: any) => {
      const castedid = service.getAsID(id);
      or.push({ _id: castedid });
    });
  } catch (e) {
    console.log('ids.forEach', e);
  }

  const pipelines = [
    {
      $match: { $or: or },
    },
    // {
    //     $sort: body.sort || { _id: 1 }
    // }
  ];

  // operate on db
  await collection
    .aggregate(pipelines)
    .exec()
    .then(async (result: any[]) => {
      ctx.state = { data: result };
      await next();
    })
    .catch((err: Error) => {
      ctx.status = (err as any).status || 500;
      ctx.body = err.message;
    });
});

// Final middleware for converting mongoose documents to JSON
dataProvider.use('/', async (ctx: Context, next: Next) => {
  // this event is responsible to covert whole mongoose doc to json form
  // including getters, public properties
  // each mongoose doc must have a "toJson" method being defined on its own Schema.

  const state = ctx.state;
  // let result;

  // // array
  // if(!isNaN(state.length)) {
  //     result = [];

  //     for (let index = 0; index < state.length; index++) {
  //         const element = state[index];
  //         if(element.hasOwnProperty('toJson'))
  //             result.push(element.toJson());
  //         else result.push(element);
  //     }
  // }
  // // object
  // else {
  //     result = state.toJson();
  // }

  ctx.body = state;
});

export { name, dataProvider as main };
