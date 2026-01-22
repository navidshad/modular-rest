# FunctionProvider Service Documentation

The FunctionProvider service allows executing server-side functions from the client. It provides a simple interface to run named functions with arguments and receive the result.

> [!TIP]
> To learn how to define functions on the server, check out the [Server-side Functions documentation](/server-client-ts/modules/functions).

To use the FunctionProvider service, import it as follows:

```javascript
import { functionProvider } from '@modular-rest/client'
```

## `run()`

Executes a server-side function.

### Arguments

| Name    | Type                             | Description                                  |
| ------- | -------------------------------- | -------------------------------------------- |
| options | `{ name: string; args: any }`    | Object containing function name and arguments |

### Return and Throw

| Type           | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `Promise<any>` | Resolves with the result returned by the server-side function      |
| Error          | Throws an error if the function execution fails or returns an error |

### Example

```javascript
const options = {
  name: 'calculateSum',
  args: { a: 10, b: 20 }
};

functionProvider.run(options)
  .then(result => console.log('Function result:', result))
  .catch(error => console.error('Function execution failed:', error));
```
