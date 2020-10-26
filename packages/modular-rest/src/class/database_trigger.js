class DatabaseTrigger {
    /**
     * Is a definition for a callback being called on 
     * a specific database transaction.
     * 
     * @param {string} operation Operation name
     * @param {function} callback trigger callback
     */
    constructor(operation, callback = (query, queryResult) => { }) {
        this.operation = operation;
        this.callback = callback;
    }
}

module.exports = DatabaseTrigger;