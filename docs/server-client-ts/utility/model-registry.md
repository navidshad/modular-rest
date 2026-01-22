# Model Registry

The `modelRegistry` is a singleton service that manages Mongoose models and connections across different databases defined in your modules. It allows you to access raw Mongoose models directly if you need to perform operations not covered by the default data provider.

## Usage

```typescript
import { modelRegistry } from '@modular-rest/server';

// Get a specific model
const userModel = modelRegistry.getModel('my_database', 'users');

if (userModel) {
  const users = await userModel.find({ active: true });
}
```

## API Reference

### `getModel(database: string, collection: string)`
Returns the Mongoose model for the specified database and collection.

### `getConnection(database: string)`
Returns the Mongoose connection instance for the specified database.

### `hasModel(database: string, collection: string)`
Checks if a model is registered for the given database and collection.
