# Concept

The permission system in this framework provides a robust way to control access to your application's resources. It works by matching permission types that users have against those required by different parts of the system.

### How It Works?

At its core, the permission system uses access types - special flags like `user_access`, `advanced_settings`, or custom types you define. These access types are used in two key places:

1. **Permission**: When defining collections or functions, you provide a list of Permission instances that specify which access types are required. Each Permission instance defines what operations (read/write) are allowed for a specific access type. For example, one Permission might allow read access for `user_access`, while another Permission enables write access for `advanced_settings`.

2. **Permission Group**: Each user is assigned certain access types through their permission group. When they try to access a resource, the system checks if they have the required permission types.

The system only allows an operation when there's a match between the permission types required by the resource and those assigned to the user making the request.

## Permission
<!-- @include: @/server-client-ts/generative/classes/permission.md -->

## Permission Types
<!-- @include: @/server-client-ts/generative/classes/permissionTypes.md -->

## Access Types
<!-- @include: @/server-client-ts/generative/classes/accessTypes.md -->

## Access Definition
<!-- @include: @/server-client-ts/generative/classes/accessDefinition.md -->

## Permission Group
<!-- @include: @/server-client-ts/generative/classes/permissionGroup.md -->

