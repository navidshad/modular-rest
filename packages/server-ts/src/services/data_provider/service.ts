import mongoose, { Connection, Model, PopulateOptions, Query } from 'mongoose';
import { AccessTypes, AccessDefinition, Permission } from '../../class/security';

import TypeCasters from './typeCasters';
import { config } from '../../config';
import { CollectionDefinition } from '../../class/collection_definition';
import { User } from '../../class/user';
import modelRegistry from './model_registry';

/**
 * Service name constant
 * @constant {string}
 */
export const name = 'dataProvider';

// Set mongoose options
mongoose.set('useCreateIndex', true);

// Database connections and collections storage
const connections: Record<string, Connection> = {};
const collections: Record<string, Record<string, Model<any>>> = {};
const permissionDefinitions: Record<string, Record<string, AccessDefinition>> = {};

/**
 * MongoDB connection options
 * @interface MongoOption
 * @property {string} [dbPrefix] - Prefix for database names
 * @property {string} mongoBaseAddress - MongoDB connection URL
 */
export interface MongoOption {
  dbPrefix?: string;
  mongoBaseAddress: string;
}

/**
 * Collection definition options
 * @interface CollectionDefinitionOption
 * @property {CollectionDefinition[]} list - List of collection definitions
 * @property {MongoOption} mongoOption - MongoDB connection options
 */
interface CollectionDefinitionListOption {
  list: CollectionDefinition[];
  mongoOption: MongoOption;
}

/**
 * Connects to a database and sets up collections based on collection definitions
 * @function connectToDatabaseByCollectionDefinitionList
 * @param {string} dbName - Name of the database to connect to
 * @param {CollectionDefinition[]} [collectionDefinitionList=[]] - List of collection definitions
 * @param {MongoOption} mongoOption - MongoDB connection options
 * @returns {Promise<void>} A promise that resolves when the connection is established
 * @throws {Error} If triggers are not properly configured
 * @private
 */
function connectToDatabaseByCollectionDefinitionList(
  dbName: string,
  collectionDefinitionList: CollectionDefinition[] = [],
  mongoOption: MongoOption
): Promise<void> {
  return new Promise((done, reject) => {
    // Check if connection already exists in registry
    let connection = modelRegistry.getConnection(dbName);

    // Create db connection if it doesn't exist
    if (!connection) {
      const fullDbName = (mongoOption.dbPrefix || '') + dbName;
      const connectionString = mongoOption.mongoBaseAddress;

      console.info(`- Connecting to database: ${fullDbName}`);

      connection = mongoose.createConnection(connectionString, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        dbName: fullDbName,
        serverSelectionTimeoutMS: 10000, // 10 second timeout for server selection
        socketTimeoutMS: 45000, // 45 second timeout for socket operations
      });
    } else {
      const fullDbName = (mongoOption.dbPrefix || '') + dbName;
      console.info(`- Using existing connection for database: ${fullDbName}`);
    }

    // Store connection
    connections[dbName] = connection;

    // add db models from schemas
    collectionDefinitionList.forEach(collectionDefinition => {
      const collection = collectionDefinition.collection;
      const schema = collectionDefinition.schema;

      if (collections[dbName] == undefined) collections[dbName] = {};

      if (permissionDefinitions[dbName] == undefined) permissionDefinitions[dbName] = {};

      // Check if model already exists in registry (pre-created)
      let model = modelRegistry.getModel(dbName, collection);

      if (!model) {
        // Model doesn't exist in registry, create it on the connection
        // This can happen if defineCollection was called without mongoOption
        model = connection.model(collection, schema);
      } else {
        // Model exists in registry, verify it's using the same connection
        // Mongoose models are bound to their connection, so we should use the registry model
        // But we need to ensure the connection matches
        const registryConnection = modelRegistry.getConnection(dbName);
        if (registryConnection && registryConnection !== connection) {
          // Connections don't match, but this shouldn't happen in normal flow
          // Use the model from registry as it's already created
          model = modelRegistry.getModel(dbName, collection)!;
        }
      }

      // Store model in global collections object
      collections[dbName][collection] = model;

      // Also update the CollectionDefinition with the model if it has a setModel method
      if (collectionDefinition.setModel) {
        collectionDefinition.setModel(model);
      }

      // define Access Definition from component permissions
      // and store it on global access definition object
      permissionDefinitions[dbName][collection] = new AccessDefinition({
        database: dbName,
        collection: collection,
        permissionList: collectionDefinition.permissions,
      });


    });

    // If connection is already connected, resolve immediately
    if (connection.readyState === 1) {
      const fullDbName = (mongoOption.dbPrefix || '') + dbName;
      console.info(`- ${fullDbName} database has been connected`);
      done();
    } else {
      connection.on('connected', () => {
        const fullDbName = (mongoOption.dbPrefix || '') + dbName;
        console.info(`- ${fullDbName} database has been connected`);
        done();
      });

      connection.on('error', err => {
        reject(err);
      });
    }
  });
}

/**
 * Adds collection definitions and connects to their respective databases
 * @function addCollectionDefinitionByList
 * @param {CollectionDefinitionListOption} options - Collection definition options
 * @returns {Promise<void>} A promise that resolves when all collections are set up
 * @example
 * ```typescript
 * await addCollectionDefinitionByList({
 *   list: [
 *     new CollectionDefinition({
 *       database: 'myapp',
 *       collection: 'users',
 *       schema: userSchema,
 *       permissions: [new Permission({ type: 'user_access', read: true })]
 *     })
 *   ],
 *   mongoOption: {
 *     mongoBaseAddress: 'mongodb://localhost:27017',
 *     dbPrefix: 'myapp_'
 *   }
 * });
 * ```
 */
export async function addCollectionDefinitionByList({
  list,
  mongoOption,
}: CollectionDefinitionListOption): Promise<void> {
  // First, ensure all collections are registered in the ModelRegistry
  // This pre-creates models before connections are established
  list.forEach(collectionDefinition => {
    // Check if model already exists in registry
    if (!modelRegistry.hasModel(collectionDefinition.database, collectionDefinition.collection)) {
      // Register the collection and create its model
      modelRegistry.registerCollection(collectionDefinition, mongoOption);
    }
  });

  // Group collection definitions by database
  const dbGroups: Record<string, CollectionDefinition[]> = {};
  list.forEach(collectionDefinition => {
    if (!dbGroups[collectionDefinition.database]) {
      dbGroups[collectionDefinition.database] = [];
    }
    dbGroups[collectionDefinition.database].push(collectionDefinition);
  });

  // Connect to each database
  // Models are already pre-created, so connections will use existing models
  const connectionPromises = Object.entries(dbGroups).map(([dbName, collectionDefinitionList]) =>
    connectToDatabaseByCollectionDefinitionList(dbName, collectionDefinitionList, mongoOption)
  );

  await Promise.all(connectionPromises);
}

/**
 * Gets a Mongoose model for a specific collection
 * @function getCollection
 * @param {string} db - Database name
 * @param {string} collection - Collection name
 * @returns {Model<T>} Mongoose model for the collection
 * @throws {Error} If the collection doesn't exist
 * @example
 * ```typescript
 * const userModel = getCollection('myapp', 'users');
 * const users = await userModel.find();
 * ```
 */
export function getCollection<T>(db: string, collection: string): Model<T> {
  if (!collections[db] || !collections[db][collection]) {
    throw new Error(`Collection ${collection} not found in database ${db}`);
  }
  return collections[db][collection];
}

/**
 * Gets the permission list for a specific operation on a collection
 * @function _getPermissionList
 * @param {string} db - Database name
 * @param {string} collection - Collection name
 * @param {string} operationType - Type of operation (read/write)
 * @returns {any[]} List of permissions
 * @private
 */
function _getPermissionList(db: string, collection: string, operationType: string): Permission[] {
  if (!permissionDefinitions[db] || !permissionDefinitions[db][collection]) {
    return [];
  }
  return permissionDefinitions[db][collection].permissionList;
}

/**
 * Checks if a user has access to perform an operation on a collection
 * @function checkAccess
 * @param {string} db - Database name
 * @param {string} collection - Collection name
 * @param {string} operationType - Type of operation (read/write)
 * @param {Record<string, any>} queryOrDoc - Query or document being accessed
 * @param {User} user - User performing the operation
 * @returns {boolean} Whether the user has access
 * @example
 * ```typescript
 * const hasAccess = checkAccess('myapp', 'users', 'read', {}, currentUser);
 * if (hasAccess) {
 *   const users = await getCollection('myapp', 'users').find();
 * }
 * ```
 */
export function checkAccess(
  db: string,
  collection: string,
  operationType: string,
  queryOrDoc: Record<string, any>,
  user: User
): boolean {
  const permissionList = _getPermissionList(db, collection, operationType);
  return permissionList.some(permission => {
    if (permission.accessType === 'god_access') return true;
    if (permission.accessType === 'anonymous_access' && user.type === 'anonymous') return true;
    if (permission.accessType === 'user_access' && user.type === 'user') return true;
    if (typeof (user as any).hasPermission === 'function' && user.hasPermission(permission.accessType)) {
      if (operationType === AccessTypes.read) return permission.read;
      if (operationType === AccessTypes.write) return permission.write;
    }
    return false;
  });
}

/**
 * Converts a string ID to a MongoDB ObjectId
 * @function getAsID
 * @param {string} strId - String ID to convert
 * @returns {mongoose.Types.ObjectId | undefined} MongoDB ObjectId or undefined if invalid
 * @example
 * ```typescript
 * const id = getAsID('507f1f77bcf86cd799439011');
 * if (id) {
 *   const doc = await collection.findById(id);
 * }
 * ```
 */
export function getAsID(strId: string): mongoose.Types.ObjectId | undefined {
  try {
    return mongoose.Types.ObjectId(strId);
  } catch (e) {
    return undefined;
  }
}

/**
 * Applies populate options to a Mongoose query
 * @function performPopulateToQueryObject
 * @param {Query<T, any>} queryObj - Mongoose query object
 * @param {PopulateOptions[]} [popArr=[]] - Array of populate options
 * @returns {Query<T, any>} Query with populate options applied
 * @example
 * ```typescript
 * const query = collection.find();
 * const populatedQuery = performPopulateToQueryObject(query, [
 *   { path: 'author', select: 'name email' }
 * ]);
 * ```
 */
export function performPopulateToQueryObject<T = any>(
  queryObj: Query<T, any>,
  popArr: PopulateOptions[] = []
): Query<T, any> {
  popArr.forEach(pop => {
    queryObj.populate(pop);
  });
  return queryObj;
}

/**
 * Applies additional options to a Mongoose query
 * @function performAdditionalOptionsToQueryObject
 * @param {Query<T, any>} queryObj - Mongoose query object
 * @param {Record<string, any>} options - Additional query options
 * @returns {Query<T, any>} Query with additional options applied
 * @example
 * ```typescript
 * const query = collection.find();
 * const queryWithOptions = performAdditionalOptionsToQueryObject(query, {
 *   sort: { createdAt: -1 },
 *   limit: 10
 * });
 * ```
 */
export function performAdditionalOptionsToQueryObject<T = any>(
  queryObj: Query<T, any>,
  options: Record<string, any>
): Query<T, any> {
  Object.entries(options).forEach(([key, value]) => {
    // @ts-ignore
    queryObj[key](value);
  });
  return queryObj;
}

// Instead, export TypeCasters
export { TypeCasters };
