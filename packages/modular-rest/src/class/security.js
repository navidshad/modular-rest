class AccessDefinition {
    constructor({ database, collection, permissionList }) {
        this.database = database;
        this.collection = collection;
        this.permissionList = permissionList;
    }
}

class Permission {
    constructor({ type, read = false, write = false, onlyOwnData = false }) {
        this.type = type;
        this.read = read;
        this.write = write;
        /**
         * If true users can perform CRUD on documents that they created already.
         */
        this.onlyOwnData = onlyOwnData;
    }
}

class PermissionTypes {
    constructor() {
        this.god_access = 'god_access';
        this.user_access = 'user_access';
        this.upload_file_access = 'upload_file_access';
        this.remove_file_access = 'remove_file_access';
        this.anonymous_access = 'anonymous_access';
    }

    static get god_access() { return 'god_access' };
    static get user_access() { return 'user_access' };
    static get upload_file_access() { return 'upload_file_access' };
    static get remove_file_access() { return 'remove_file_access' };
    static get anonymous_access() { return 'anonymous_access' };
}

class AccessTypes {
    static get read() { return 'read' };
    static get write() { return 'write' };
}

module.exports = {
    AccessDefinition, Permission, PermissionTypes, AccessTypes
}