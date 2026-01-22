# Concept
In Modular-rest you have mongodb database support out of the box. you just need to define your data models in `db.[js|ts]` files. they have to be located in modules directory. for example if you have a module named `user` you have to create a file named `db.[js|ts]` in `modules/user` directory.


## How to Define a Collection
<!-- @include: @/server-client-ts/generative/functions/defineCollection.md -->


## Schema
You can define data stracture for your collection by passing a [mongoose schema](https://mongoosejs.com/docs/5.x/docs/guide.html) to `schema` option.

```typescript
import { Schema } from '@modular-rest/server';

const userSchema = new Schema({ // [!code focus:4]
	name: String,
	age: Number
});

defineCollection({
	database: 'users',
	collection: 'info',
	schema: userSchema, // [!code focus]
	permissions: Permission[]
	trigger: DatabaseTrigger[]
})
```

### File Schema
Modular-rest has a predefined file schema that you it is necessary to use this schema if your collection needs to store files.

**Note**: Modular-rest does not store the file directly in the database. Instead, it places the file in the [upload directory](/server-client-ts/quick-start.md#modules-and-upload-directory) specified in the [config object](/server-client-ts/quick-start.md#configuration-summary-table). The file information is then recorded in the database.

```typescript
import { schemas } from '@modular-rest/server';

const userSchema = new Schema({
	name: String,
	age: Number,

	// Added this file to the parent schema
	avatar: schemas.file
});
```


## Permissions
The permission system in this framework provides a robust way to control access to your application's resources. It works by matching permission types that users have against those required by different parts of the system. [Read more](/server-client-ts/advanced/permission-and-user-access.md)

<!-- @include: @/server-client-ts/generative/classes/permission.md#example -->

## Triggers
In a complex application, you may need to perform additional actions after a database operation. This is where triggers come in.

### Database Triggers
Database triggers allow you to define callbacks for specific database operations on a collection.
<!-- @include: @/server-client-ts/generative/classes/databaseTrigger.md -->

### CMS Triggers
CMS triggers allow you to define callbacks for operations performed via the CMS.
<!-- @include: @/server-client-ts/generative/classes/CmsTrigger.md -->

## Linking Collections
You can link any collection from same database into an schema to perform `populate queries`, but let me tell you what it is simply:

`Populate query` is a query that you can use to get data from linked collections. for example if you have a collection named `user` and you have a collection named `post` that each post has an author. you can link `user` collection into `post` collection and then you can use populate query to get author of each post, it you the user data in author field of each post.

More info on [populate queries](https://mongoosejs.com/docs/5.x/docs/populate.html).

```typescript
import { Schema } from '@modular-rest/server';

const userSchema = new Schema({
	name: String,
	age: Number
});

const postSchema = new Schema({
	title: String,
	content: String,
	author: {
		type: Schema.Types.ObjectId,
		ref: 'user'
	}
});
```

## Full Example
Let's see a full example of `db.ts` file:

```typescript
import { Schema, schemas, CollectionDefinition, Permission, DatabaseTrigger } from '@modular-rest/server';

const userSchema = new Schema({
	name: String,
	age: Number,

	// Added this file to the parent schema
	avatar: schemas.file
});

const postSchema = new Schema({
	title: String,
	content: String,
	author: {
		type: Schema.Types.ObjectId,
		ref: 'user'
	}
});

const userPermissions = [
	new Permission({
		new Permission({
			type: 'god_access',
			read: true,
			write: true,
		}),
		new Permission({
			type: 'user_access',
			read: true,
			write: true,
			onlyOwnData: true,
		}),
		new Permission({
			type: 'anonymous_access',
			read: true,
		}),
	})
];

const userTriggers = [
	new DatabaseTrigger('insert-one',
		(data) => {
			// send email to user
		}
	})
];

module.exports = [
	new CollectionDefinition({
		db: 'user',
		name: 'info',
		schema: userSchema,
		permissions: userPermissions,
		trigger: userTriggers
	}),
	new CollectionDefinition({
		db: 'user',
		name: 'post',
		schema: postSchema,
		permissions: userPermissions,
		trigger: userTriggers
	})
]
```
