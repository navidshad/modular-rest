let Router = require('koa-router');
let validateObject = require('../../class/validator');
let reply = require('../../class/reply').create;
let name = 'file';

let { AccessTypes } = require('./../../class/security');

let DataService = require('./../data_provider/service');
let service = require('./service');
let middleware = require('../../middlewares');
let fileRouter = new Router();

fileRouter.use('/', middleware.auth, async (ctx, next) => {
    await next();
});

fileRouter.post('/', async (ctx) => {

    let body = ctx.body;

    // Access validation
    let hasAccess = DataService.checkAccess('cms', 'file', AccessTypes.write, body, ctx.state.user);
    if (!hasAccess) {
        ctx.throw(403, 'access denied');
        return
    }

    let file = ctx.request.files.file;
    let result;

    if (!file) {
        ctx.status = 412;
        result = reply('f',
            { 'message': 'file field required' });
    }

    else {
        await service.storeFile({
            file: file,
            ownerId: ctx.state.user.id
        })
            .then((file) => {
                result = reply('s', { file });
            })
            .catch((error) => {
                ctx.status = 412;
                result = reply('e', error);
            });
    }

    ctx.body = result;
});

fileRouter.delete('/', async (ctx) => {
    let body = ctx.request.query;
    // validate
    let bodyValidate = validateObject(body, 'id');

    let result;

    if (!bodyValidate.isValid) {
        ctx.status = 412;
        result = reply('f', { 'message': 'some fields required.', 'error': bodyValidate.requires });
    }

    else {
        await service.removeFile(body.id)
            .then(() => {
                result = reply('s');
            })
            .catch((e) => {
                ctx.status = 412;
                result = reply('e', { 'error': e });
            });
    }

    console.log('remove', result);
    ctx.body = result;
});

module.exports.name = name;
module.exports.main = fileRouter;