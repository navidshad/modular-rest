module.exports = class CollectionDefinition {
    /**
     * This class helps to create a mongoose collection 
     * associated with permissions and triggers .
     * 
     * @param {object} option
     * @param {string} option.db database name
     * @param {string} option.collection collection name
     * @param {object} option.schema mongoose schema
     * @param {array} option.permissions a list of Permission for this collection 
     * @param {array} option.trigger a DatabaseTrigger
     */
    constructor({ db, collection, schema, permissions, trigger }) {
        // string
        this.database = db;
        // string
        this.collection = collection;
        // schema object of mongoose
        this.schema = schema;
        // a list of Permission for this collection
        this.permissions = permissions;

        this.trigger = trigger;
    }
}