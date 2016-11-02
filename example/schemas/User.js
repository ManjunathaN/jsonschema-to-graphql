module.exports = {
  tableName: 'User',
  description: 'User Model',
  primaryKey: 'id',
  foreignKeys: [{
    // Name of the association
    name: 'parent',
    description: 'User\'s Parent',
    // joins from
    fields: 'parentId',
    // joins to
    reference: {
      datapackage: '',
      resource: 'user',
      fields: 'id'
    }
  }, {
    // Name of the association
    name: 'movies',
    description: 'User\'s Movies',
    // joins from
    fields: 'id',
    // joins to
    reference: {
      datapackage: '',
      resource: 'movie',
      fields: 'userId'
    }
  }],
  fields: [{
    name: 'parentId',
    description: 'User\'s Parent Id',
    type: 'integer'
  }, {
    name: 'id',
    description: 'User Id',
    type: 'integer',
    constraints: {
      required: true,
      autoincrement: true

    }
  }, {
    name: 'userName',
    description: 'User\'s Name',
    type: 'string',
    constraints: {
      required: true,
      unique: true
    }
  }, {
    name: 'email',
    description: 'User\'s Email',
    type: 'string',
    constraints: {
      required: true
    }
  }, {
    name: 'gender',
    description: 'User\'s Gender',
    type: 'string',
    constraints: {
      enum: ['Male', 'Female']
    }
  }, {
    name: 'ignoreField',
    description: 'Skip Field',
    type: 'string'
  }]
};
