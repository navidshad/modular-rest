var mongoose = require('mongoose');
var Schema = mongoose.Schema;

let CollectionDefinition = require('../../class/collection_definition');
let { Permission, PermissionTypes } = require('../../class/security');

module.exports = [
    new CollectionDefinition({
        db: 'cms',
        collection: 'file',
        schema: new Schema({
            originalName: String,
            fileName: String,
            owner: String,
        }),
        permissions: [
            new Permission({
                type: PermissionTypes.upload_file_access,
                read: true,
                write: true,
                onlyOwnData: false,
            }),
            new Permission({
                type: PermissionTypes.remove_file_access,
                read: true,
                write: true,
                onlyOwnData: false,
            }),
        ],
    }),
]