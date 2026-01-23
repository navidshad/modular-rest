import DatabaseTrigger, { DatabaseTriggerContext } from './database_trigger';

/**
 * Type for CMS operations that can trigger a callback
 * @typedef {('update-one' | 'insert-one' | 'remove-one')} CmsOperation
 * @description Supported CMS operations:
 * - 'update-one': Triggered when updating a single document in the CMS
 * - 'insert-one': Triggered when inserting a new document in the CMS
 * - 'remove-one': Triggered when removing a document from the CMS
 */
export type CmsOperation = 'update-one' | 'insert-one' | 'remove-one';

/**
 * Defines a callback to be executed on specific CMS operations
 * @class CmsTrigger
 * @property {CmsOperation} operation - The CMS operation that triggers the callback
 * @property {Function} callback - The callback function to be executed
 * @example
 * ```typescript
 * const trigger = new CmsTrigger('insert-one', (context) => {
 *   console.log('New CMS document inserted:', context.queryResult);
 *   // Perform additional actions after CMS document insertion.
 * });
 *
 * // Use the trigger in RestOptions
 * const { app } = await createRest({
 *   authTriggers: [trigger],
 *   // ... other options
 * });
 * ```
 */
export class CmsTrigger extends DatabaseTrigger {


  /**
   * Creates a new CmsTrigger instance
   * @param {CmsOperation} operation - The CMS operation to trigger on
   * @param {Function} [callback=() => {}] - The callback function to execute
   * @example
   * ```typescript
   * // Log all CMS updates
   * const updateTrigger = new CmsTrigger('update-one', (context) => {
   *   console.log('CMS document updated:', context.queryResult);
   * });
   *
   * // Track CMS document removals
   * const removeTrigger = new CmsTrigger('remove-one', (context) => {
   *   console.log('CMS document removed:', context.queryResult);
   * });
   * ```
   */
  constructor(
    operation: CmsOperation,
    callback: (context: DatabaseTriggerContext) => void = () => { }
  ) {
    super(operation, callback);
  }
}

export default CmsTrigger;
