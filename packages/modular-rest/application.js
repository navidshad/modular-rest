let koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
var path = require('path');
var Combination = require('./src/class/combinator');
let DataProvider = require('./src/services/data_provider/service');

let defaultServiceRoot = __dirname + '/src/services';

/**
 * 
 * @param {object} option
 * 
 * @param {string} option.componentDirectory root directory of your router.js/db.js files.
 * @param {string} option.uploadDirectory root directory for upload files.
 * @param {function} option.onBeforeInit a callback being called before init koa server.
 * @param {function} option.onAfterInit a callback being called after server initialization.
 * @param {number} option.port server port
 * @param {boolean} option.dontListen server will not being run if it was true and just return koa app object.
 * 
 * @param {string} option.mongo mongodb options.
 * @param {string} option.mongo.dbPrefix a prefix for your database name.
 * @param {string} option.mongo.mongoBaseAddress the address of your mongo server without any database specification on it.
 * 
 * @param {object} option.keypair RSA keypair for authentication module
 * @param {string} option.keypair.private
 * @param {string} option.keypair.public
 * 
 * @param {object} option.adminUser supper admin user to being created as the first user of the system.
 * @param {string} option.adminUser.email
 * @param {string} option.adminUser.password
 */
async function createRest({
    componentDirectory,
    uploadDirectory,
    keypair,
    onBeforeInit,
    onAfterInit,
    port = 3000,
    dontListen = false,
    mongo = {
        mongoBaseAddress: 'mongodb://localhost:27017',
        dbPrefix: 'mrest_',
    },
    adminUser = {
        email: 'admin@email,com',
        password: '@dmin',
    },
}) {

    let options = {
        componentDirectory,
        uploadDirectory,
        keypair,
        onBeforeInit,
        onAfterInit,
        port,
        dontListen,
        mongo,
        adminUser,
    };

    let app = new koa();

    /**
     * Plug in BodyParser
     */
    let bodyParserOptions = { multipart: true };
    app.use(koaBody(bodyParserOptions));

    /**
     * Plug In KoaStatic
     */
    if (options.uploadDirectory)
        app.use(koaStatic(uploadDirectory));

    /**
     * Run before hook
     */
    if (options.onBeforeInit) onBeforeInit(app);

    /**
     * Setup default services
     * 
     * - Collect and plug in router.js/db.js of default services
     * - Setting up default services 
     */

    // Plug in default routes
    await Combination.combineRoutesByFilePath(
        path.join(defaultServiceRoot), app);

    // Collect default databaseDefinitions
    let defaultDatabaseDefinitionList = await Combination.combineModulesByFilePath({
        rootDirectory: defaultServiceRoot,
        filename: { name: 'db', extension: '.js' },
        combineWithRoot: true
    });

    // Plug in default databaseDefinitions
    await DataProvider.addCollectionDefinitionByList({
        list: defaultDatabaseDefinitionList,
        mongoOption: options.mongo
    })

    // Setting up default services
    await require('./src/helper/presetup_services').setup(options);

    /**
     * User Services
     * 
     * Plug in routes and database
     */
    if (options.componentDirectory) {

        // Plug in user routes
        await Combination.combineRoutesByFilePath(options.componentDirectory, app);

        // Collect user CollectionDefinitions (db.js files)
        let userDatabaseDetail = [];
        userDatabaseDetail = await Combination.combineModulesByFilePath({
            rootDirectory: options.componentDirectory,
            filename: { name: 'db', extension: '.js' },
            combineWithRoot: true
        });

        // Plug in user CollectionDefinitions
        await DataProvider.addCollectionDefinitionByList({
            list: userDatabaseDetail || [],
            mongoOption: options.mongo
        })
    }

    /**
     * Run the server
     * 
     * return KOA app object 
     */
    return new Promise((done, reject) => {

        if (!options.dontListen) {
            app.listen(options.port);
            console.log('\x1b[35m', `KOAS has been launched on: localhost:${options.port}`);
        }


        // on after init
        if (options.onAfterInit) onAfterInit(app);

        //done
        done(app);
    });
}

module.exports = createRest;