# Modular-Rest
a nodejs module based on KOAJS for developing Rest-APIs in a modular solution. 
- modular-rest is only for developing rest api, and is not based on MVC.
- each route would be a module in this system. you can define your base routes on difrent folders then the Modular-Rest would combine all routes to main app object.

this module has one method:
- `createRest`: is the main functionality of the module.

**Note**: active "javascript.implicitProjectConfig.checkJs": true in your vscode settings.

## Install 

Install using [npm](https://www.npmjs.com/package/modular-rest):

```sh
npm i modular-rest --save
```

## use modular-rest `createRest`

to work with modular-rest you need an `app.js` and a `routers` folder. then configuring `app.js` and put your each router as a subfolder into the `routers` folder.


### configuring `app.js`
simple configuration of `app.js` with `koa-router` module.

```js
const modularRest = require('modular-rest');
let koaBody = require('koa-body');

let option = {
    root: require('path').join(__dirname, 'routers'),
    onBeforInit: BeforInit, // befor anything
    onInit: Init,           // after collecting routers
    onAfterInit: AfterInit, // affter launch server
    port: 80,

    // if it would be true, app doesn't listen to port,
    // and a raw app object with all routers will be returned.
    // this option is for virtual host middlewares
    dontlisten: false,

    // collecting other services from subfolders
    otherSrvice: [
        {
            filename: {name: 'fn', extension:'.js'},
            rootDirectory: require('path').join(__dirname, 'routers'),
            option: {
                    // if this option woulde be true, the property of each service will be attached to rootObject
                    // the `name` property will be rejected and only the main property of each service would be recognize.
                    // it would be useful when you want to collect all mongoose models in one root object.
                    combineWithRoot: false,

                    // convert the rootObject to an array
                    // the `name` property will be rejected and only the main property of each service would be recognize.
                    convertToArray: false,
                }
        }
    ],
};

function BeforInit(app)
{
    // use a body parser
    // it must be used befor init
    app.use(koaBody());
}

function Init(app, otherSrvice)
{   
    // use otherSrvice
    // all your other services will injected to `otherSrvice` object.
    // eahc service would be accessible by its filename
    global.services = otherSrvice['fn'];
}

function AfterInit(app, otherSrvice) {
  // do something
}

modularRest.createRest(option).then(app => {
    // do something
});
```

### configuring a route
1. go to `routers` folder and create a subfolder called `search` folder. 
2. go to `search` folder and create a `route.js` file, then put these lines into it.

```js
let Router = require('koa-router');
let name = 'search';

let search = new Router();
search.get('/', (ctx) => {
    ctx.body = 'send me a post request';
});

search.post('/', (ctx) => {
    ctx.body = `Request Body: ${JSON.stringify(ctx.request.body)}`;
})

module.exports.name = name;
module.exports.main = search;
```

### Requesting
your search web service is:
```
http://localhost:80/search
```


thank you for using Modular-Rest :)
