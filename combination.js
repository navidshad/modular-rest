let Router = require('koa-router');
let walker = require('./lib/directory_walker.js');

module.exports.combinRoutes = async (rootDirectory, app) => 
{
    // find route pathes
    let option = {name: 'router', filter: ['.js']}
    let routerPaths = await walker.find(root, option).then()
        .catch(e => {console.log(e)});

    // create and combine routes into the app
    for (let i = 0; i < routerPaths.length; i++) 
    {
        let service = require(routerPaths[i]);
        let name = service.name;

        
        var serviceRouter = new Router();
        serviceRouter.use(`/${name}`, service.main.routes());

        app.use(serviceRouter.routes());
    }
}


// custom combination
module.exports.Custom = async (rootDirectory, rootObject, filename) => 
{
    // find route pathes
    let option = {name: filename.name, filter: [filename.extension]}
    let modulesPath = await walker.find(rootDirectory, option).then()
        .catch(e => {console.log(e)});

    // create and combine routes into the app
    for (let i = 0; i < modulesPath.length; i++) 
    {
        let moduleObject = require(modulesPath[i]);
        let name = moduleObject.name;

        rootObject[name] = moduleObject;
    }
}