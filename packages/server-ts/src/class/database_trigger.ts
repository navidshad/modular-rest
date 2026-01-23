/**
 * Type for database operations that can trigger a callback
 */
export type DatabaseOperation =
  | 'find'
  | 'find-one'
  | 'count'
  | 'update-one'
  | 'insert-one'
  | 'remove-one'
  | 'aggregate'
  | 'insert-many'
  | 'delete-many'
  | 'find-one-and-update'
  | 'find-one-and-delete'
  | 'distinct'
  | 'validate';

/**
 * Context interface for database trigger callbacks
 * @interface DatabaseTriggerContext
 * @property {Record<string, any>} doc - The document data for insert/update/validate operations.
 * @property {Record<string, any>[]} docs - The documents data for insert-many operations.
 * @property {Record<string, any>} query - The query data for find/remove/count/distinct operations
 * @property {Record<string, any>} update - The update data for update operations
 * @property {Record<string, any>[]} pipelines - The aggregation pipelines for aggregate operations
 * @property {any} queryResult - The result of the database operation (can be document, array of documents, number, or null)
 */
export interface DatabaseTriggerContext {
  doc?: Record<string, any>;
  docs?: Record<string, any>[];
  query?: Record<string, any>;
  update?: Record<string, any>;
  pipelines?: Record<string, any>[];
  queryResult: any;
}


/**
 * The callback function to be executed on specific database operations
 * @param {DatabaseTriggerContext} context - The context of the database operation
 * @example
 * ```typescript
 * const trigger = new DatabaseTrigger('insert-one', (context) => {
 *   console.log('New document inserted:', context.queryResult);
 * });
 * ```
 */
type DatabaseTriggerCallback = (context: DatabaseTriggerContext) => void;

/**
 * In a complex application, you may need to perform additional actions after a database operation.
 * This is where DatabaseTrigger comes in, allowing you to define callbacks for specific database operations on a collection.
 *
 * ### Supported Triggers and Contexts
 *
 * The `callback` function associated with a trigger receives a {@link DatabaseTriggerContext} object. The properties available in this context vary depending on the trigger operation.
 *
 * | Trigger Operation | Description | Context Data |
 * | :--- | :--- | :--- |
 * | `insert-one` | Triggered after a single document insertion. | `doc`: The inserted document.<br>`queryResult`: The inserted document. |
 * | `insert-many` | Triggered after multiple document insertions. | `docs`: The array of inserted documents.<br>`queryResult`: The array of inserted documents. |
 * | `update-one` | Triggered after updating a single document (using `updateOne`). | `query`: The query filter used.<br>`update`: The update operations applied.<br>`queryResult`: The operation result. |
 * | `find-one-and-update` | Triggered after `findOneAndUpdate`. | `query`: The query filter used.<br>`update`: The update operations applied.<br>`queryResult`: The updated document. |
 * | `delete-many` | Triggered after removing multiple documents (using `deleteMany`). | `query`: The query filter used.<br>`queryResult`: The operation result. |
 * | `remove-one` | Triggered after removing a single document (using `deleteOne`). | `query`: The query filter used.<br>`queryResult`: The operation result. |
 * | `find-one-and-delete` | Triggered after `findOneAndDelete` or `findOneAndRemove`. | `query`: The query filter used.<br>`queryResult`: The removed document. |
 * | `find` | Triggered after a `find` query. | `query`: The query filter used.<br>`queryResult`: Array of found documents. |
 * | `find-one` | Triggered after a `findOne` query. | `query`: The query filter used.<br>`queryResult`: The found document. |
 * | `count` | Triggered after a `countDocuments` query. | `query`: The query filter used.<br>`queryResult`: The count (number). |
 * | `aggregate` | Triggered after an aggregation pipeline. | `pipelines`: The aggregation pipeline used.<br>`queryResult`: The aggregation result. |
 * | `distinct` | Triggered after a `distinct` query. | `query`: The query filter used.<br>`queryResult`: The distinct values. |
 * | `validate` | Triggered after document validation. | `doc`: The validated document.<br>`queryResult`: The validated document. |
 *
 * @property {DatabaseOperation} operation - The database operation that triggers the callback
 * @property {DatabaseTriggerCallback} callback - The callback function to be executed
 *
 * @example
 * ```typescript
 * import { DatabaseTrigger } from '@modular-rest/server';
 *
 * const trigger = new DatabaseTrigger('insert-one', ({ doc, queryResult }) => {
 *   console.log('New document inserted:', queryResult);
 *   // Perform additional actions
 * });
 *
 * // Use the trigger in a collection definition
 * const collection = new CollectionDefinition({
 *   triggers: [trigger]
 * });
 * ```
 */
export class DatabaseTrigger {
  operation: DatabaseOperation;
  callback: (context: DatabaseTriggerContext) => void;

  /**
   * @hidden
   *
   * Creates a new DatabaseTrigger instance
   * @param {DatabaseOperation} operation - The database operation to trigger on
   * @param {DatabaseTriggerCallback} [callback=() => {}] - The callback function to execute
   *
   * @example
   * ```typescript
   * const trigger = new DatabaseTrigger('insert-one', (context) => {
   *   console.log('New document inserted:', context.queryResult);
   * });
   *
   */
  constructor(operation: DatabaseOperation, callback: DatabaseTriggerCallback = () => { }) {
    this.operation = operation;
    this.callback = callback;
  }
  /**
   * Applies the trigger to a Mongoose schema
   * @param {Schema} schema - The mongoose schema to apply the trigger to
   */
  applyToSchema(schema: any): void {
    const callback = this.callback;

    switch (this.operation) {
      case 'insert-one':
        schema.post('save', function (doc: any) {
          callback({
            doc: doc.toObject ? doc.toObject() : doc,
            queryResult: doc,
          });
        });
        break;

      case 'update-one':
        schema.post('updateOne', function (this: any, result: any) {
          callback({
            query: this.getQuery(),
            update: this.getUpdate(),
            queryResult: result,
          });
        });
        break;

      case 'remove-one':
        schema.post('deleteOne', function (this: any, result: any) {
          callback({
            query: this.getQuery(),
            queryResult: result,
          });
        });
        break;

      case 'find':
        schema.post('find', function (this: any, docs: any[]) {
          callback({
            query: this.getQuery(),
            queryResult: docs, // Pass docs directly, Mongoose returns documents
          });
        });
        break;

      case 'find-one':
        schema.post('findOne', function (this: any, doc: any) {
          callback({
            query: this.getQuery(),
            queryResult: doc,
          });
        });
        break;

      case 'count':
        schema.post('countDocuments', function (this: any, count: any) {
          callback({
            query: this.getQuery(),
            queryResult: count,
          });
        });
        break;

      case 'aggregate':
        schema.post('aggregate', function (this: any, docs: any[]) {
          callback({
            pipelines: this.pipeline(),
            queryResult: docs,
          });
        });
        break;

      case 'insert-many':
        schema.post('insertMany', function (docs: any[]) {
          callback({
            docs: docs,
            queryResult: docs,
          });
        });
        break;

      case 'delete-many':
        schema.post('deleteMany', function (this: any, result: any) {
          callback({
            query: this.getQuery(),
            queryResult: result,
          });
        });
        break;

      case 'find-one-and-update':
        schema.post('findOneAndUpdate', function (this: any, doc: any) {
          callback({
            query: this.getQuery(),
            update: this.getUpdate(),
            queryResult: doc,
          });
        });
        break;

      case 'find-one-and-delete':
        schema.post('findOneAndDelete', function (this: any, doc: any) {
          callback({
            query: this.getQuery(),
            queryResult: doc,
          });
        });
        // Also support findOneAndRemove which is deprecated but might be used
        schema.post('findOneAndRemove', function (this: any, doc: any) {
          callback({
            query: this.getQuery(),
            queryResult: doc,
          });
        });
        break;

      case 'distinct':
        schema.post('distinct', function (this: any, result: any) {
          callback({
            query: this.getQuery(),
            queryResult: result,
          });
        });
        break;

      case 'validate':
        schema.post('validate', function (doc: any) {
          callback({
            doc: doc.toObject ? doc.toObject() : doc,
            queryResult: doc,
          });
        });
        break;


      default:
        console.warn(`Unsupported trigger operation: ${this.operation}`);
    }
  }
}

export default DatabaseTrigger;
