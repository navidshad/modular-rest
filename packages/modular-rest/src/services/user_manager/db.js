var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let CollectionDefinition = require('../../class/collection_definition');
let { Permission, PermissionTypes } = require('../../class/security');

/**
 * Permission schema
 * 
 * This schema is generated dynamically
 * by combining default & custom permissions.
 */
let permissionSchemaConstructorOption = {
    title: String,
    isAnonymous: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
};
Object.keys(new PermissionTypes())
    .forEach(key => {
        let fieldOption = { type: Boolean, default: false };
        permissionSchemaConstructorOption[key] = fieldOption;
    })

let permissionSchema = new Schema(permissionSchemaConstructorOption);
permissionSchema.index({ title: 1 }, { unique: true });

let authSchema = new Schema({
    permission: { type: Schema.Types.ObjectId, ref: 'permission', required: false },
    email: String,
    phone: String,
    password: String,
    type: { type: String, default: 'user', enum: ['user', 'anonymous'] }
});
authSchema.index({ email: 1 }, { unique: true });

let detailSchema = new Schema({
    referenceId: { type: Schema.Types.ObjectId, ref: 'auth', required: true },
    fullname: String,
    imgStamp: String,
});
detailSchema.index({ referenceId: 1 }, { unique: true });

module.exports = [
    new CollectionDefinition({
        db: 'cms',
        collection: 'auth',
        schema: authSchema,
        permissions: [
            new Permission({
                type: PermissionTypes.advanced_settings,
                read: true,
                write: true
            }),
        ]
    }),

    new CollectionDefinition({
        db: 'cms',
        collection: 'permission',
        schema: permissionSchema,
        permissions: [
            new Permission({
                type: PermissionTypes.advanced_settings,
                read: true,
                write: true
            }),
        ],
    }),

    new CollectionDefinition({
        db: 'cms',
        collection: 'user',
        schema: detailSchema,
        permissions: [
            new Permission({
                type: PermissionTypes.customer_access,
                read: true,
                write: true,
                onlyOwnData: true
            }),
            new Permission({
                type: PermissionTypes.user_manager,
                read: true,
                write: true
            }),
        ]
    })
]