import _ from 'lodash';
import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLFloat,
  GraphQLList,
  GraphQLID,
  GraphQLInt
} from 'graphql';
import utils from './utils';

function isNullType(type) {
  return type === 'null' || type === null;
}

function isNullSchema(schema) {
  return isNullType(schema.type) || (_.isArray(schema.type) && _.every(schema.type, isNullType));
}

function enumToGraphQLField(enumeration, propName, ctx) {
  const typeName = `${ctx.typeNamePrefix}${_.upperFirst(_.camelCase(propName))}Enum`;

  if (!ctx.typeDefs[typeName]) {
    const enumValues = {};
    // eslint-disable-next-line no-param-reassign
    ctx.typeDefs[typeName] = new GraphQLEnumType({
      name: typeName,
      values: _.reduce(enumeration, (valuesT, enumValue) => {
        enumValues[enumValue] = {
          value: enumValue
        };
        return enumValues;
      }, {})
    });
  }

  return {
    type: ctx.typeDefs[typeName]
  };
}

function toGraphQLField(jsonSchema, propName, ctx) {
  let schemas;

  if (jsonSchema.anyOf || jsonSchema.oneOf) {
    schemas = _.reject(jsonSchema.anyOf || jsonSchema.oneOf, isNullSchema);

    if (schemas.length === 1) {
      return toGraphQLField(schemas[0], propName, ctx);
    }
    throw new Error(`multiple anyOf/oneOf schemas in json schema is not supported. schema: ${JSON.stringify(jsonSchema)}`);
  } else if (_.isArray(jsonSchema.type)) {
    const type = _.reject(jsonSchema.type, isNullType);

    if (type.length === 1) {
      // eslint-disable-next-line no-use-before-define
      return typeToGraphQLField(type[0], jsonSchema, propName, ctx);
    }
    throw new Error(`multiple values in json schema "type" property not supported. schema: ${JSON.stringify(jsonSchema)}`);
  } else {
    // eslint-disable-next-line no-use-before-define
    return typeToGraphQLField(jsonSchema.type, jsonSchema, propName, ctx);
  }
}

function objectToGraphQLField(jsonSchema, propName, ctx) {
  const typeName = `${ctx.typeNamePrefix}${_.upperFirst(_.camelCase(propName))}JsonType`;

  if (!ctx.typeIndex[typeName]) {
    // eslint-disable-next-line no-param-reassign
    ctx.typeDefs[typeName] = new GraphQLObjectType({
      name: typeName,
      fields: () => {
        const fields = {};

        _.forOwn(jsonSchema.properties, (propSchema, propNameT) => {
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
  if (_.isArray(jsonSchema.items)) {
    throw new Error(`multiple values in "items" of array type is not supported. schema: ${JSON.stringify(jsonSchema)}`);
  }

  return {
    type: new GraphQLList(toGraphQLField(jsonSchema.items, propName, ctx).type)
  };
}

const primitiveToGraphQLType = (type) => {
  switch (type) {
    case 'string':
      return GraphQLString;
    case 'integer':
      return GraphQLInt;
    case 'number':
      return GraphQLFloat;
    case 'boolean':
      return GraphQLBoolean;
    default:
      return null;
  }
};

const scalarToGraphQLType = (type) => {
  switch (type) {
    case 'String':
      return GraphQLString;
    case 'Int':
      return GraphQLInt;
    case 'Float':
      return GraphQLFloat;
    case 'Bool':
      return GraphQLBoolean;
    case 'GraphQLID':
      return GraphQLID;
    default:
      return null;
  }
};

const primitiveToGraphQLField = (type) => {
  const graphQlType = primitiveToGraphQLType(type);

  if (!graphQlType) {
    throw new Error(`cannot convert json schema type ${type} into GraphQL type`);
  }

  return {
    type: graphQlType
  };
};

function typeToGraphQLField(type, jsonSchema, propName, ctx) {
  let graphQlField;

  if (_.has(jsonSchema, 'constraints.enum') && _.isArray(jsonSchema.constraints.enum)) {
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

const jsonSchemaToGraphQLFields = (tableName, modelProperties, opt = {}) => {
  const ctx = _.defaults(opt, {
    include: null,
    exclude: null,
    typeNamePrefix: tableName || '',
    typeDefs: {}
  });

  const fields = {};

  _.each(modelProperties, (propSchema) => {
    const propName = propSchema.name;
    // filters model's propName..
    if (utils.isExcluded(ctx, propName)) {
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
