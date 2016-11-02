module.exports = {
  tableName: 'Movie',
  description: 'Movie Model',
  primaryKey: 'id',
  foreignKeys: [{
    // Name of the association
    name: 'user',
    description: 'Owner of Movie',
    // joins from
    fields: 'userId',
    // joins to
    reference: {
      datapackage: '',
      resource: 'user',
      fields: 'id'
    }
  }],
  fields: [{
    name: 'id',
    description: 'Movie Id',
    type: 'integer',
    constraints: {
      required: true,
      autoincrement: true
    }
  }, {
    name: 'userId',
    description: 'Movie Owner\'s Id',
    type: 'integer'
  }, {
    name: 'title',
    description: 'Movie Title',
    type: 'string'
  }]
};
