let name = 'dataProvider';
var colog = require('colog');
let { AccessTypes, AccessDefinition } = require('../../class/security');

const Mongoose = require('mongoose');
Mongoose.set('useCreateIndex', true);

let connections = {};
let collections = {};
let permissionDefinitions = {};

let triggers = require('./../../class/trigger_operator');
let TypeCasters = require('./typeCasters');

/**
 * 
 * @param {string} dbName database name
 * @param {array} CollectionDefinitionList an array of CollectionDefinition instance
 * @param {object} mongoOption
 * @param {string} mongoOption.dbPrefix
 * @param {string} mongoOption.mongoBaseAddress
 */
function connectToDatabaseByCollectionDefinitionList(dbName, collectionDefinitionList = [], mongoOption) {

    return new Promise((done, reject) => {
        // create db connection
        let connectionString = mongoOption.mongoBaseAddress + `/${mongoOption.dbPrefix + dbName}`;
        let connection = Mongoose.createConnection(connectionString, { useUnifiedTopology: true, useNewUrlParser: true, });
        // store connection
        connections[dbName] = connection;

        // add db models from schemas
        collectionDefinitionList.forEach(collectionDefinition => {

            let collection = collectionDefinition.collection;
            let schema = collectionDefinition.schema;

            if (collections[dbName] == undefined)
                collections[dbName] = {};

            if (permissionDefinitions[dbName] == undefined)
                permissionDefinitions[dbName] = {};

            // create model from schema
            // and store in on global collection object
            collections[dbName][collection] = connection.model(collection, schema);

            // define Access Definition from component permissions
            // and store it on global access definition object
            permissionDefinitions[dbName][collection] = new AccessDefinition({
                database: dbName,
                collection: collection,
                permissionList: collectionDefinition.permissions
            });

            // add trigger
            if (collectionDefinition.trigger != undefined) {
                triggers.addTrigger(collectionDefinition.trigger);
            }

        })

        connection.on('connected', () => {
            colog.success(`- ${mongoOption.dbPrefix + dbName} database has been connected`)
            done()
        });
    })
}

/**
 * 
 * @param {object} option
 * @param {array} option.list an array of CollectionDefinition instance
 * @param {object} option.mongoOption
 * @param {string} option.mongoOption.dbPrefix
 * @param {string} option.mongoOption.mongoBaseAddress
 */
async function addCollectionDefinitionByList({ list, mongoOption }) {
    let clusteredByDBName = {};

    // cluster list by their database name.
    list.forEach(collectionDefinition => {
        let database = collectionDefinition.database;
        if (!clusteredByDBName[database]) clusteredByDBName[database] = [];
        clusteredByDBName[database].push(collectionDefinition);
    })

    // connect to databases
    for (const dbName in clusteredByDBName) {
        if (clusteredByDBName.hasOwnProperty(dbName)) {
            const collectionDefinitionList = clusteredByDBName[dbName];
            await connectToDatabaseByCollectionDefinitionList(dbName, collectionDefinitionList, mongoOption);
        }
    }
}

function getCollection(db, collection) {
    let fountCollection;

    if (collections.hasOwnProperty(db)) {
        if (collections[db].hasOwnProperty(collection))
            fountCollection = collections[db][collection];
    }

    return fountCollection;
}

function _getPermissionList(db, collection, operationType) {
    let permissionList = [];
    let permissionDefinition;

    if (!permissionDefinitions.hasOwnProperty(db))
        return permissionList;

    permissionDefinition = permissionDefinitions[db][collection];

    permissionDefinition.permissionList.forEach(permission => {
        if (permission.onlyOwnData == true) {
            permissionList.push(permission);
        }

        else if (operationType == AccessTypes.read &&
            permission.read == true) {
            permissionList.push(permission);
        }

        else if (operationType == AccessTypes.write &&
            permission.write == true) {
            permissionList.push(permission);
        }
    });

    return permissionList;
}

function checkAccess(db, collection, operationType, queryOrDoc, user) {
    let key = false;
    let permissionList = _getPermissionList(db, collection, operationType);

    permissionList.forEach(permission => {
        let permissionType = permission.type;

        if (permission.onlyOwnData == true) {
            let owner = queryOrDoc.owner;
            let userId = user.id;

            try {
                if (owner.toString() == userId.toString())
                    key = true;
            } catch (error) {
                key = false;
            }
        }

        else if (operationType == AccessTypes.read) {
            if (permission.read &&
                user.permission[permissionType] == true)
                key = true;
        }

        else if (operationType == AccessTypes.write) {

            if (permission.write &&
                user.permission[permissionType] == true)
                key = true;
        }
    });

    return key;
}

function getAsID(strId) {
    let id;
    try {
        id = Mongoose.Types.ObjectId(strId);
    } catch (e) {
        console.log('strId did not cast objectId', e);
    }

    return id;
}

// connectToAllDatabases();

module.exports = {
    name, addCollectionDefinitionByList, getCollection,
    checkAccess, getAsID,
    triggers,
    TypeCasters,
}

