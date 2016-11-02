'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isNullType(type) {
  return type === 'null' || type === null;
}

function isNullSchema(schema) {
  return isNullType(schema.type) || _lodash2.default.isArray(schema.type) && _lodash2.default.every(schema.type, isNullType);
}

function enumToGraphQLField(enumeration, propName, ctx) {
  var typeName = '' + ctx.typeNamePrefix + _lodash2.default.upperFirst(_lodash2.default.camelCase(propName)) + 'Enum';

  if (!ctx.typeDefs[typeName]) {
    (function () {
      var enumValues = {};
      // eslint-disable-next-line no-param-reassign
      ctx.typeDefs[typeName] = new _graphql.GraphQLEnumType({
        name: typeName,
        values: _lodash2.default.reduce(enumeration, function (valuesT, enumValue) {
          enumValues[enumValue] = {
            value: enumValue
          };
          return enumValues;
        }, {})
      });
    })();
  }

  return {
    type: ctx.typeDefs[typeName]
  };
}

function toGraphQLField(jsonSchema, propName, ctx) {
  var schemas = void 0;

  if (jsonSchema.anyOf || jsonSchema.oneOf) {
    schemas = _lodash2.default.reject(jsonSchema.anyOf || jsonSchema.oneOf, isNullSchema);

    if (schemas.length === 1) {
      return toGraphQLField(schemas[0], propName, ctx);
    }
    throw new Error('multiple anyOf/oneOf schemas in json schema is not supported. schema: ' + JSON.stringify(jsonSchema));
  } else if (_lodash2.default.isArray(jsonSchema.type)) {
    var type = _lodash2.default.reject(jsonSchema.type, isNullType);

    if (type.length === 1) {
      // eslint-disable-next-line no-use-before-define
      return typeToGraphQLField(type[0], jsonSchema, propName, ctx);
    }
    throw new Error('multiple values in json schema "type" property not supported. schema: ' + JSON.stringify(jsonSchema));
  } else {
    // eslint-disable-next-line no-use-before-define
    return typeToGraphQLField(jsonSchema.type, jsonSchema, propName, ctx);
  }
}

function objectToGraphQLField(jsonSchema, propName, ctx) {
  var typeName = '' + ctx.typeNamePrefix + _lodash2.default.upperFirst(_lodash2.default.camelCase(propName)) + 'JsonType';

  if (!ctx.typeIndex[typeName]) {
    // eslint-disable-next-line no-param-reassign
    ctx.typeDefs[typeName] = new _graphql.GraphQLObjectType({
      name: typeName,
      fields: function fields() {
        var fields = {};

        _lodash2.default.forOwn(jsonSchema.properties, function (propSchema, propNameT) {
          fields[propNameT] = toGraphQLField(propSchema, propNameT, ctx);
        });

        return fields;
      }
    });
  }

  return {
    type: ctx.typeDefs[typeName]
  };
}

function arrayToGraphQLField(jsonSchema, propName, ctx) {
  if (_lodash2.default.isArray(jsonSchema.items)) {
    throw new Error('multiple values in "items" of array type is not supported. schema: ' + JSON.stringify(jsonSchema));
  }

  return {
    type: new _graphql.GraphQLList(toGraphQLField(jsonSchema.items, propName, ctx).type)
  };
}

var primitiveToGraphQLType = function primitiveToGraphQLType(type) {
  switch (type) {
    case 'string':
      return _graphql.GraphQLString;
    case 'integer':
      return _graphql.GraphQLInt;
    case 'number':
      return _graphql.GraphQLFloat;
    case 'boolean':
      return _graphql.GraphQLBoolean;
    default:
      return null;
  }
};

var scalarToGraphQLType = function scalarToGraphQLType(type) {
  switch (type) {
    case 'String':
      return _graphql.GraphQLString;
    case 'Int':
      return _graphql.GraphQLInt;
    case 'Float':
      return _graphql.GraphQLFloat;
    case 'Bool':
      return _graphql.GraphQLBoolean;
    case 'GraphQLID':
      return _graphql.GraphQLID;
    default:
      return null;
  }
};

var primitiveToGraphQLField = function primitiveToGraphQLField(type) {
  var graphQlType = primitiveToGraphQLType(type);

  if (!graphQlType) {
    throw new Error('cannot convert json schema type ' + type + ' into GraphQL type');
  }

  return {
    type: graphQlType
  };
};

function typeToGraphQLField(type, jsonSchema, propName, ctx) {
  var graphQlField = void 0;

  if (_lodash2.default.has(jsonSchema, 'constraints.enum') && _lodash2.default.isArray(jsonSchema.constraints.enum)) {
    graphQlField = enumToGraphQLField(jsonSchema.constraints.enum, propName, ctx);
  } else if (type === 'object') {
    graphQlField = objectToGraphQLField(jsonSchema, propName, ctx);
  } else if (type === 'array') {
    graphQlField = arrayToGraphQLField(jsonSchema, propName, ctx);
  } else {
    graphQlField = primitiveToGraphQLField(type);
  }

  if (jsonSchema.description) {
    graphQlField.description = jsonSchema.description;
  }

  return graphQlField;
}

var jsonSchemaToGraphQLFields = function jsonSchemaToGraphQLFields(tableName, modelProperties) {
  var opt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var ctx = _lodash2.default.defaults(opt, {
    include: null,
    exclude: null,
    typeNamePrefix: tableName || '',
    typeDefs: {}
  });

  var fields = {};

  _lodash2.default.each(modelProperties, function (propSchema) {
    var propName = propSchema.name;
    // filters model's propName..
    if (_utils2.default.isExcluded(ctx, propName)) {
      return;
    }

    if (propSchema.type) {
      fields[propName] = toGraphQLField(propSchema, propName, ctx);
    }
  });

  return fields;
};

exports.primitiveToGraphQLType = primitiveToGraphQLType;
exports.jsonSchemaToGraphQLFields = jsonSchemaToGraphQLFields;
exports.scalarToGraphQLType = scalarToGraphQLType;