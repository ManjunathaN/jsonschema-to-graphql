'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _jsonSchemaUtils = require('./jsonSchemaUtils');

var _jsonSchemaUtils2 = _interopRequireDefault(_jsonSchemaUtils);

var _argsFactory = require('./argsFactory');

var _argsFactory2 = _interopRequireDefault(_argsFactory);

var _defaultResolver = require('./defaultResolver');

var _defaultResolver2 = _interopRequireDefault(_defaultResolver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// http://dataprotocols.readthedocs.io/en/latest/json-table-schema.html
var JSONSchemaValidator = require('jsontableschema').validate; /* eslint-disable object-shorthand */

var SchemaBuilder = function () {
  function SchemaBuilder(opts) {
    (0, _classCallCheck3.default)(this, SchemaBuilder);

    // Field to Store all the Schema Definitions provided for building the graphQL
    this.schemaDefs = [];
    // Model Object for processing...
    this.models = {};
    // GraphQL Model Type Definitions
    this.modelTypeDefs = {};
    // Resolvers.
    this.resolver = opts.resolver || new _defaultResolver2.default();
    // Skip Constraint Models
    this.skipConstraintModels = opts.skipConstraintModels || false;
    // Skip Operator Fields
    this.skipOperatorFields = opts.skipOperatorFields || false;
    // Skip Pagination Fields
    this.skipPaginationFields = opts.skipPaginationFields || false;
    // Skip SortBy Fields
    this.skipSortByFields = opts.skipSortByFields || false;
    // Custom Query Functions 
    this.customQueryFunctions = {};
    // Custom Mutation Functions
    this.customMutationFunctions = {};
  }

  // Add Schemas


  (0, _createClass3.default)(SchemaBuilder, [{
    key: 'addSchema',
    value: function addSchema(schemaFile) {
      var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      // Validate JSON Schema.
      this.schemaDefs.push(schemaFile);

      var tableName = schemaFile.tableName;
      if (!tableName) {
        throw new Error('tableName cannot be empty');
      }
      var primaryKeys = _lodash2.default.compact(_lodash2.default.flatten([schemaFile.primaryKey]));
      var foreignKeys = _lodash2.default.filter(_lodash2.default.compact(_lodash2.default.flatten([schemaFile.foreignKeys])), function (o) {
        return !_utils2.default.isExcluded(opt, o.name);
      });
      var properties = _lodash2.default.filter(schemaFile.fields || {}, function (o) {
        return !_utils2.default.isExcluded(opt, o.name);
      });
      // console.log(properties);

      // Update Models hash for building the schema.
      // TODO: check referencial integrity violations.
      this.models[tableName] = {
        // TableName
        tableName: tableName,
        // Properties in the schema, this will be used to populate fields attribute.
        properties: properties,
        primaryKeys: primaryKeys,
        foreignKeys: foreignKeys,
        fields: null,
        args: null,
        // Options for generating QL Schema.
        opt: opt
      };

      return this;
    }
  }, {
    key: 'processModelData',
    value: function processModelData(modelData) {
      var isList = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var skipReqArgs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var mutationOpts = arguments[3];

      var fields = _jsonSchemaUtils2.default.jsonSchemaToGraphQLFields(modelData.tableName, modelData.properties, {
        include: modelData.opt.include,
        exclude: modelData.opt.exclude,
        typeDefs: this.modelTypeDefs
      });

      var retValue = void 0;
      if (!isList) {
        retValue = this.rootSingleField(modelData, fields, mutationOpts);
      } else {
        retValue = this.rootListField(modelData, fields, skipReqArgs);
      }
      return retValue;
    }
  }, {
    key: 'getSingleFieldName',
    value: function getSingleFieldName(modelData) {
      var defaultFieldName = this.fieldNameForModel(modelData.tableName);
      var singleFieldName = modelData.opt.fieldName || defaultFieldName;
      return singleFieldName;
    }
  }, {
    key: 'prepareQueryFields',
    value: function prepareQueryFields() {
      var _this = this;

      var fields = {};

      _lodash2.default.forOwn(this.models, function (modelData) {
        // Prepare the properties enum list for all properties for sortBy and sortByDesc fields,
        var propsEnumName = _argsFactory2.default.getPropsEnumNameForModel(modelData.tableName);
        _this.modelTypeDefs[propsEnumName] = _argsFactory2.default.preparePropsEnumForModel(modelData);
      });

      // Handle only for Single Model.
      _lodash2.default.forOwn(this.models, function (modelData) {
        var singleFieldName = _this.getSingleFieldName(modelData);

        fields[singleFieldName] = _this.processModelData(modelData);
        if (!_this.skipConstraintModels) {
          _lodash2.default.assign(fields, _this.prepareConstraintFields(singleFieldName, modelData));
        }

        // Handle for List Models.
        var listFieldName = (0, _pluralize2.default)(singleFieldName);
        fields[listFieldName] = _this.processModelData(modelData, true, true);
      });

      return fields;
    }

    // prepare type definitions based on constraints defined in schema.
    // handles only unique and required constraints, priority is given to unique first.

  }, {
    key: 'prepareConstraintFields',
    value: function prepareConstraintFields(singleFieldName, modelData) {
      var _this2 = this;

      var fields = {};

      _lodash2.default.each(modelData.properties, function (pkey) {
        if (pkey.constraints) {
          var isPrimaryKey = _lodash2.default.includes(modelData.primaryKeys, pkey.name);
          // Skip building the root if the key is already part of Primary Key.
          if (!isPrimaryKey) {
            var tmpModelData = {
              tableName: modelData.tableName,
              properties: [pkey],
              primaryKeys: [pkey.name],
              foreignKeys: null,
              fields: null,
              args: null,
              opt: {}
            };

            // Handle all the constraint fields.
            if (pkey.constraints.unique) {
              var fieldName = singleFieldName + 'By' + _lodash2.default.upperFirst(pkey.name);
              fields[fieldName] = _this2.processModelData(tmpModelData);
            } else if (pkey.constraints.required) {
              var _fieldName = (0, _pluralize2.default)(singleFieldName) + 'By' + _lodash2.default.upperFirst(pkey.name);
              // TODO: Change the Return type to array.
              fields[_fieldName] = _this2.processModelData(tmpModelData, true, false);
            }
          }
        }
      });

      return fields;
    }
  }, {
    key: 'prepareArgsForModel',
    value: function prepareArgsForModel(modelData, fields, mutationOpts) {
      var args = {};

      _lodash2.default.each(modelData.primaryKeys, function (pkey) {
        var pkeyField = fields[pkey];
        if (pkeyField.type && pkeyField.type instanceof _graphql.GraphQLScalarType) {
          var fieldGraphType = pkeyField.type; //jsonSchemaUtils.scalarToGraphQLType(pkeyField.type.name);

          if (fieldGraphType) {
            args[pkey] = {
              type: new _graphql.GraphQLNonNull(fieldGraphType)
            };
          }
        }
      });

      // TODO:; Handle different scenarios.
      if (mutationOpts === 'create' || mutationOpts === 'update') {
        // for mutation include required fields
        _lodash2.default.each(modelData.properties, function (pkey) {
          var pkeyField = fields[pkey.name];
          if (pkey.constraints) {
            if (pkey.constraints.autoincrement && mutationOpts === 'create') {
              delete args[pkey.name];
            } else if (pkey.constraints.unique || pkey.constraints.required) {
              if (pkeyField && !args[pkey.name]) {
                if (mutationOpts === 'create') {
                  args[pkey.name] = {
                    type: new _graphql.GraphQLNonNull(pkeyField.type)
                  };
                } else {
                  args[pkey.name] = {
                    type: pkeyField.type
                  };
                }
              }
            }
          } else {
            if (pkeyField && !args[pkey.name]) {
              args[pkey.name] = {
                type: pkeyField.type
              };
            }
          }
        });
      }
      return args;
    }
  }, {
    key: 'prepareOperatorArgsForModel',
    value: function prepareOperatorArgsForModel(modelData) {
      var args = {};

      _lodash2.default.each(modelData.properties, function (pkey) {
        var graphDataType = _jsonSchemaUtils2.default.primitiveToGraphQLType(pkey.type);

        if (graphDataType) {
          (function () {
            var typeInfo = {
              type: graphDataType
            };

            var typeInfoArray = {
              type: new _graphql.GraphQLList(graphDataType)
            };

            var operatorsMap = _argsFactory2.default.operatorsMap(pkey.type);
            // contains key as suffix and value to figure out if this operation applies on array or not.
            var operatorSuffices = _lodash2.default.transform(_lodash2.default.values(operatorsMap), function (result, value) {
              result[value.suffix] = value.isArray;
            }, {});

            _lodash2.default.each(operatorSuffices, function (value, key) {
              if (key !== '_IsNull') {
                args[pkey.name + key] = value ? typeInfoArray : typeInfo;
              } else {
                args[pkey.name + key] = {
                  type: _jsonSchemaUtils2.default.primitiveToGraphQLType('boolean')
                };
              }
            });
          })();
        }
      });
      return args;
    }
  }, {
    key: 'getPropsEnumForModel',
    value: function getPropsEnumForModel(tableName) {
      var propsEnumName = _argsFactory2.default.getPropsEnumNameForModel(tableName);
      return this.modelTypeDefs[propsEnumName];
    }
  }, {
    key: 'prepareSortArgsForModel',
    value: function prepareSortArgsForModel(tableName) {
      var typeInfo = {
        type: this.getPropsEnumForModel(tableName)
      };

      var retValue = {
        sortBy: typeInfo,
        sortByDesc: typeInfo
      };
      return retValue;
    }
  }, {
    key: 'rootSingleField',
    value: function rootSingleField(modelData, fields, mutationOpts) {
      var resolveHandler = void 0;

      switch (mutationOpts) {
        case 'create':
          resolveHandler = this.resolver.create(modelData.tableName);
          break;
        case 'update':
          resolveHandler = this.resolver.update(modelData.tableName, modelData.primaryKeys);
          break;
        case 'delete':
          resolveHandler = this.resolver.delete(modelData.tableName);
          break;
        default:
          resolveHandler = this.resolver.read();
          break;
      }

      var retValue = {
        type: this.typeForModel(modelData, fields, mutationOpts),
        args: this.prepareArgsForModel(modelData, fields, mutationOpts),
        resolve: resolveHandler
      };
      return retValue;
    }
  }, {
    key: 'rootListField',
    value: function rootListField(modelData, fields, skipReqArgs) {
      var retValue = {
        type: new _graphql.GraphQLList(this.typeForModel(modelData, fields)),
        args: _lodash2.default.assign({}, skipReqArgs ? {} : this.prepareArgsForModel(modelData, fields), this.skipOperatorFields ? {} : skipReqArgs ? this.prepareOperatorArgsForModel(modelData) : {}, this.skipPaginationFields ? {} : _argsFactory2.default.preparePaginationArgsForModel(), this.skipSortByFields ? {} : this.prepareSortArgsForModel(modelData.tableName)),
        resolve: this.resolver.read()
      };
      return retValue;
    }

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'fieldNameForModel',
    value: function fieldNameForModel(modelClass) {
      return _utils2.default.typeNameForModel(modelClass);
    }
  }, {
    key: 'typeForModel',
    value: function typeForModel(modelData, fields, mutationOpts) {
      var typeName = this.fieldNameForModel(modelData.tableName);
      typeName = _lodash2.default.isEmpty(mutationOpts) ? typeName : _lodash2.default.upperFirst(mutationOpts) + typeName;

      if (!this.modelTypeDefs[typeName]) {
        this.modelTypeDefs[typeName] = new _graphql.GraphQLObjectType({
          name: typeName,
          fields: this.fetchFields(modelData, fields, mutationOpts)
        });
      }

      return this.modelTypeDefs[typeName];
    }

    // Handle different types for different operations - select and mutations.

  }, {
    key: 'fetchFields',
    value: function fetchFields(modelData, fields, mutationOpts) {
      var _this3 = this;

      var fieldFunctions = void 0;

      switch (mutationOpts) {
        case 'create':
        case 'update':
          fieldFunctions = function fieldFunctions() {
            return _lodash2.default.extend({},
            // attrFields of modelData
            fields);
          };
          break;
        case 'delete':
          fieldFunctions = function fieldFunctions() {
            return _lodash2.default.extend({},
            // pick only primary key fields exposed in delete operation.
            _lodash2.default.pick(fields, modelData.primaryKeys));
          };
          break;
        default:
          fieldFunctions = function fieldFunctions() {
            return _lodash2.default.extend({},
            // attrFields of modelData
            fields,
            // Relational Fields
            _this3.relationFields(modelData));
          };
          break;
      }

      return fieldFunctions;
    }
  }, {
    key: 'relationFields',
    value: function relationFields(modelData) {
      var _this4 = this;

      var fields = {};

      _lodash2.default.forOwn(modelData.foreignKeys, function (relation) {
        var joinTableName = _this4.fieldNameForModel(relation.reference.resource);
        fields[relation.name] = _this4.relationField(joinTableName, relation);
      });

      return fields;
    }
  }, {
    key: 'relationField',
    value: function relationField(joinTableName, relation) {
      var type = this.typeForModel({
        tableName: joinTableName
      });

      var graphType = type;
      var args = {};
      var foreignKey = relation.reference.fields;
      if ((0, _pluralize2.default)(relation.name) === relation.name) {
        graphType = new _graphql.GraphQLList(type);
        foreignKey = relation.reference.fields; // relation.fields;
        args = _lodash2.default.assign({}, this.skipPaginationFields ? {} : _argsFactory2.default.preparePaginationArgsForModel(), this.skipSortByFields ? {} : this.prepareSortArgsForModel(joinTableName));
      }

      var typeField = {
        type: graphType,
        description: relation.description,
        args: args,
        resolve: this.resolver.relation({
          foreignKey: foreignKey,
          foreignKeyValue: relation.fields
        })
      };

      return typeField;
    }
  }, {
    key: 'prepareMutationFields',
    value: function prepareMutationFields(mutationOpts) {
      var _this5 = this;

      var fields = {};

      // Handle only for Single Model.
      _lodash2.default.forOwn(this.models, function (modelData) {
        var singleFieldName = _this5.getSingleFieldName(modelData);
        fields[_lodash2.default.upperFirst(mutationOpts) + singleFieldName] = _this5.processModelData(modelData, false, false, mutationOpts);
      });

      return fields;
    }
  }, {
    key: 'addCustomQueryFunction',
    value: function addCustomQueryFunction(functionTest) {
      _lodash2.default.assign(this.customQueryFunctions, functionTest);
      return this;
    }
  }, {
    key: 'addCustomMutationFunction',
    value: function addCustomMutationFunction(functionTest) {
      _lodash2.default.assign(this.customMutationFunctions, functionTest);
      return this;
    }
  }, {
    key: 'build',
    value: function build() {
      var _this6 = this;

      // validate all the schema Files, atleast one schema file must be present.
      if (_lodash2.default.isEmpty(this.schemaDefs)) {
        throw new Error('Need atleast one Schema file');
      }

      // validate all the schemas
      // await Promise.all(_.map(this.schemaDefs, JSONSchemaValidator));

      var query = new _graphql.GraphQLObjectType({
        name: 'Query',
        description: 'Query description',
        fields: function fields() {
          return _lodash2.default.assign({}, _this6.prepareQueryFields(), _this6.customQueryFunctions);
        }
      });

      var mutation = new _graphql.GraphQLObjectType({
        name: 'Mutation',
        description: 'Mutation description',
        fields: function fields() {
          return _lodash2.default.assign({}, _this6.prepareMutationFields('create'), _this6.prepareMutationFields('update'), _this6.prepareMutationFields('delete'));
        }
      });

      // Prepare Query Schema..
      var retValue = new _graphql.GraphQLSchema({
        query: query,
        mutation: mutation
      });

      return retValue;
    }
  }]);
  return SchemaBuilder;
}();

exports.default = SchemaBuilder;


module.exports = SchemaBuilder;
module.exports = exports['default'];