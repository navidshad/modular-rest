import { Schema, Model } from 'mongoose';
import { Permission } from './security';
import { DatabaseTrigger } from './database_trigger';
import modelRegistry from '../services/data_provider/model_registry';
import { MongoOption } from '../services/data_provider/service';
import { config } from '../config';

/**
 * Configuration options for creating a collection definition.
 * This interface defines the structure for configuring MongoDB collections with their associated
 * schemas, permissions, and triggers.
 *
 * @inline
 *
 */
interface CollectionDefinitionOptions {
  /** The name of the database where the collection resides */
  database: string;
  /** The name of the collection to be configured */
  collection: string;
  /** List of permissions controlling access to the collection */
  permissions: Permission[];
  /** Optional database triggers for custom operations */
  triggers?: DatabaseTrigger[];

  /**
   * Mongoose schema definition for the collection
   * @type {Schema}
   * @see https://mongoosejs.com/docs/5.x/docs/guide.html
   */
  schema: Schema<any>;

  /**
   * Optional MongoDB connection options. If not provided, will use config.mongo if available.
   * This is used to pre-create the model before server startup.
   */
  mongoOption?: MongoOption;
}

/**
 * To have define any collection in your database you haveto use below method in your `db.[js|ts]` file and export an array of CollectionDefinition instances.
 *
 * @param {CollectionDefinitionOptions} options - The options for the collection
 * @expandType CollectionDefinitionOptions
 *
 * @returns A CollectionDefinition instance with a model property that returns the mongoose model
 *
 * @public
 *
 * @example
 * ```typescript
 * import { defineCollection } from '@modular-rest/server';
 *
 * export default [
 *   defineCollection({
 *     database: 'users',
 *     collection: 'info',
 *     // schema: Schema,
 *     // permissions: Permission[]
 *     // trigger: DatabaseTrigger[]
 *   })
 * ]
 *
 * // Access the model directly:
 * const userCollection = defineCollection({...});
 * const UserModel = userCollection.model;
 * const users = await UserModel.find();
 * ```
 */
export function defineCollection(
  options: CollectionDefinitionOptions
): CollectionDefinition & { model: Model<any> } {
  const definition = new CollectionDefinition(options);

  // Try to get mongoOption from options or config
  let mongoOption: MongoOption | undefined = options.mongoOption;
  if (!mongoOption && config.mongo) {
    mongoOption = config.mongo as MongoOption;
  }

  // If mongoOption is available, register the collection and create the model
  if (mongoOption) {
    const model = modelRegistry.registerCollection(definition, mongoOption);
    definition.setModel(model);
  }

  // Create a proxy object that includes both CollectionDefinition properties and model
  const result = definition as CollectionDefinition & { model: Model<any> };

  // Add model property getter
  Object.defineProperty(result, 'model', {
    get() {
      // If model was already set, return it
      const existingModel = definition.getModel();
      if (existingModel) {
        return existingModel;
      }

      // Otherwise, try to get from registry
      const registryModel = modelRegistry.getModel(definition.database, definition.collection);
      if (registryModel) {
        definition.setModel(registryModel);
        return registryModel;
      }

      // If still not found, try to get mongoOption from config and register now
      let currentMongoOption: MongoOption | undefined = mongoOption;
      if (!currentMongoOption && config.mongo) {
        currentMongoOption = config.mongo as MongoOption;
      }

      if (currentMongoOption) {
        const newModel = modelRegistry.registerCollection(definition, currentMongoOption);
        definition.setModel(newModel);
        return newModel;
      }

      throw new Error(
        `Model for ${definition.database}.${definition.collection} is not available. ` +
        `Ensure mongoOption is provided in defineCollection options, config.mongo is set, ` +
        `or the collection is registered via addCollectionDefinitionByList before accessing the model.`
      );
    },
    enumerable: true,
    configurable: true,
  });

  return result;
}

/**
 * A class that represents a MongoDB collection configuration. Provides full support for schema validation, access control through permissions,
 * and custom triggers for various database operations.
 *
 * @hideconstructor
 *
 * @deprecated Use `defineCollection` instead.
 *
 * @example
 * ```typescript
 * const userSchema = new Schema({
 *   name: String,
 *   email: String,
 *   age: Number
 * });
 *
 * const collection = new CollectionDefinition({
 *   database: 'myapp',
 *   collection: 'users',
 *   schema: userSchema,
 *   permissions: [
 *     new Permission({
 *       type: 'user_access',
 *       read: true,
 *       write: true
 *     })
 *   ],
 *   triggers: [
 *     new DatabaseTrigger('insert-one', (data) => {
 *       console.log('New user created:', data);
 *     })
 *   ]
 * });
 * ```
 *
 * @private
 */
export class CollectionDefinition {
  /** @readonly The name of the database */
  database: string;

  /** @readonly The name of the collection */
  collection: string;

  /** @readonly Mongoose schema definition */
  schema: Schema<any>;

  /** @readonly List of permissions for the collection */
  permissions: Permission[];

  /** @readonly Optional database triggers */
  triggers?: DatabaseTrigger[];

  /** Optional mongoose model for this collection */
  private _model: Model<any> | null = null;

  /**
   * Creates a new CollectionDefinition instance
   *
   * @param options - Configuration options for the collection
   * @returns A new instance of CollectionDefinition
   *
   * @beta
   */
  constructor({
    database,
    collection,
    schema,
    permissions,
    triggers,
  }: CollectionDefinitionOptions) {
    this.database = database;
    this.collection = collection;
    this.schema = schema;
    this.permissions = permissions;
    this.triggers = triggers;

    // Apply triggers to schema
    if (this.triggers) {
      this.triggers.forEach(trigger => {
        trigger.applyToSchema(this.schema);
      });
    }
  }

  /**
   * Get the mongoose model for this collection
   * @returns {Model<any> | null} The mongoose model or null if not set
   */
  getModel(): Model<any> | null {
    return this._model;
  }

  /**
   * Set the mongoose model for this collection
   * @param {Model<any>} model - The mongoose model
   */
  setModel(model: Model<any>): void {
    this._model = model;
  }
}
