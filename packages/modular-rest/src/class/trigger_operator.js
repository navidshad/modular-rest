class TriggerOperator {
    constructor() {
        this.triggers = [];
    }

    /**
     * add a collection trigger
     * @param {object} trigger DatabaseTrigger object
     */
    addTrigger(trigger) {
        this.triggers.push(trigger);
    }

    /**
     * Call a trigger
     * @param {string} operation operation name
     * @param {string} database database name
     * @param {string} collection collection name
     * @param {string} data 
     */
    call(operation, database, collection, data) {
        let result;

        this.triggers.forEach(trigger => {
            if (
                operation == trigger.operation &&
                database == trigger.database &&
                collection == trigger.collection
            )
                result = trigger.callback(data.input, data.output);
        });

        return result;
    }
}

TriggerOperator.instance = new TriggerOperator();
module.exports = TriggerOperator.instance;