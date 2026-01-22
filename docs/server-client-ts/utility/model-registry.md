# Model Registry

The `modelRegistry` is a singleton service that manages Mongoose models and connections across different databases defined in your modules. It allows you to access raw Mongoose models directly if you need to perform operations not covered by the default data provider, such as **Cross-Database Populate**.

## Usage

```typescript
import { modelRegistry } from '@modular-rest/server';

// Get a specific model
const userModel = modelRegistry.getModel('my_database', 'users');

if (userModel) {
  const users = await userModel.find({ active: true });
}
```

### Cross-Database Populate
One of the most powerful use cases for `modelRegistry` is enabling `populate()` queries across different databases. 

```typescript
const otherDbModel = modelRegistry.getModel('other_db', 'collection_name');
const results = await myModel.find().populate({
  path: 'field_name',
  model: otherDbModel
});
```

## API Reference

### `getModel(database: string, collection: string)`
Returns the Mongoose model for the specified database and collection.

### `getConnection(database: string)`
Returns the Mongoose connection instance for the specified database.

### `hasModel(database: string, collection: string)`
Checks if a model is registered for the given database and collection.
