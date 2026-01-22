# Concept

In the Modular-rest, functions are a powerful feature that allows developers to define and manage custom logic seamlessly within their APIs. Functions serve as a mechanism to remove traditional API development, eliminating the need to write routers directly. 

By defining a function, a router will be generated for it automatically, allowing the client library to focus solely on the API call. This feature supports more dynamic and flexible application designs, ensuring that specific actions can be encapsulated and reused while enforcing permissions and maintaining security.

> [!TIP]
> For information on how to call these functions from the client, see the [FunctionProvider client documentation](/js-client/function-provider).

## Define a Function
<!-- @include: @/server-client-ts/generative/functions/defineFunction.md -->