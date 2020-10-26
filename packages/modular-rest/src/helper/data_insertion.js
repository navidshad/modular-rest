const DataProvider = require('../services/data_provider/service');

function createPermissions() {
  let model = DataProvider.getCollection('cms', 'permission');
  
  return new Promise(async (done, reject) => {

    // create customer permission
    let isAnonymousExisted = await model.countDocuments({ title: 'anonymous' }).exec().catch(reject);
    let isCoustomerExisted = await model.countDocuments({ title: 'customer' }).exec().catch(reject);
    let isAdministratorExisted = await model.countDocuments({ title: 'administrator' }).exec().catch(reject);

    if (!isAnonymousExisted) {
      await new model({
        anonymous_access: true,
        isAnonymous: true,
        title: 'anonymous',
      }).save().catch(reject);
    }

    if (!isCoustomerExisted) {
      await new model({
        customer_access: true,
        anonymous_access: true,
        upload_file_access: true,
        remove_file_access: true,
        isDefault: true,
        title: 'customer',
      }).save().catch(reject);
    }

    if (!isAdministratorExisted) {
      await new model({
        god_access: true,
        customer_access: true,
        anonymous_access: true,
        upload_file_access: true,
        remove_file_access: true,
        title: 'administrator',
      }).save().catch(reject);
    }

    done();
  });

}

function createAdminUser({ email, password }) {
  let permissionModel = DataProvider.getCollection('cms', 'permission');
  let authModel = DataProvider.getCollection('cms', 'auth');

  return new Promise(async (done, reject) => {
    let isAnonymousExisted = await authModel.countDocuments({ type: 'anonymous' }).exec().catch(reject);
    let isAdministratorExisted = await authModel.countDocuments({ type: 'user', email: email }).exec().catch(reject);

    let anonymousPermission = await permissionModel.findOne({ title: 'anonymous' }).exec().catch(reject);
    let administratorPermission = await permissionModel.findOne({ title: 'administrator' }).exec().catch(reject);

    if (!isAnonymousExisted) {
      await new authModel({
        permission: anonymousPermission._id,
        email: '',
        phone: '',
        password: '',
        type: 'anonymous',
      }).save().catch(reject);
    }

    if (!isAdministratorExisted) {
      await new authModel({
        permission: administratorPermission._id,
        email: email,
        password: password,
        type: 'user'
      }).save().catch(reject);
    }

    done();
  });
}

module.exports = {
  createPermissions,
  createAdminUser,
};