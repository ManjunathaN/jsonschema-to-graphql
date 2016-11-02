/* eslint-disable object-shorthand */
import _ from 'lodash';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLList
} from 'graphql';
import pluralize from 'pluralize';
import utils from './utils';
import jsonSchemaUtils from './jsonSchemaUtils';
import argsFactory from './argsFactory';

// http://dataprotocols.readthedocs.io/en/latest/json-table-schema.html
const JSONSchemaValidator = require('jsontableschema').validate;

export default class SchemaBuilder {

  constructor(resolver) {
    // Field to Store all the Schema Definitions provided for building the graphQL
    this.schemaDefs = [];
    // Model Object for processing...
    this.models = {};
    // GraphQL Model Type Definitions
    this.modelTypeDefs = {};
    // Resolvers.
    this.resolver = resolver;
    // Custom Query Functions 
    this.customQueryFunctions = {};
    // Custom Mutation Functions
    this.customMutationFunctions = {};
  }

  // Add Schemas
  addSchema(schemaFile, opt = {}) {
    // Validate JSON Schema.
    this.schemaDefs.push(schemaFile);

    const tableName = schemaFile.tableName;
    if (!tableName) {
      throw new Error('tableName cannot be empty');
    }
    const primaryKeys = _.compact(_.flatten([schemaFile.primaryKey]));
    const foreignKeys = _.filter(_.compact(_.flatten([schemaFile.foreignKeys])), o => !utils.isExcluded(opt, o.name));
    const properties = _.filter(schemaFile.fields || {}, o => !utils.isExcluded(opt, o.name));
    // console.log(properties);

    // Update Models hash for building the schema.
    // TODO: check referencial integrity violations.
    this.models[tableName] = {
      // TableName
      tableName,
      // Properties in the schema, this will be used to populate fields attribute.
      properties,
      primaryKeys,
      foreignKeys,
      fields: null,
      args: null,
      // Options for generating QL Schema.
      opt
    };

    return this;
  }

  processModelData(modelData, isList = false, skipReqArgs = false, mutationOpts) {
    const fields = jsonSchemaUtils.jsonSchemaToGraphQLFields(
      modelData.tableName,
      modelData.properties, {
        include: modelData.opt.include,
        exclude: modelData.opt.exclude,
        typeDefs: this.modelTypeDefs
      });

    let retValue;
    if (!isList) {
      retValue = this.rootSingleField(modelData, fields, mutationOpts);
    } else {
      retValue = this.rootListField(modelData, fields, skipReqArgs);
    }
    return retValue;
  }

  getSingleFieldName(modelData) {
    const defaultFieldName = this.fieldNameForModel(modelData.tableName);
    const singleFieldName = modelData.opt.fieldName || defaultFieldName;
    return singleFieldName;
  }

  prepareQueryFields() {
    const fields = {};

    _.forOwn(this.models, (modelData) => {
      // Prepare the properties enum list for all properties for sortBy and sortByDesc fields,
      const propsEnumName = argsFactory.getPropsEnumNameForModel(modelData.tableName);
      this.modelTypeDefs[propsEnumName] = argsFactory.preparePropsEnumForModel(modelData);
    });

    // Handle only for Single Model.
    _.forOwn(this.models, (modelData) => {
      const singleFieldName = this.getSingleFieldName(modelData);

      fields[singleFieldName] = this.processModelData(modelData);
      _.assign(fields, this.prepareConstraintFields(singleFieldName, modelData));

      // Handle for List Models.
      const listFieldName = pluralize(singleFieldName);
      fields[listFieldName] = this.processModelData(modelData, true, true);
    });

    return fields;
  }

  // prepare type definitions based on constraints defined in schema.
  // handles only unique and required constraints, priority is given to unique first.
  prepareConstraintFields(singleFieldName, modelData) {
    const fields = {};

    _.each(modelData.properties, (pkey) => {
      if (pkey.constraints) {
        const isPrimaryKey = _.includes(modelData.primaryKeys, pkey.name);
        // Skip building the root if the key is already part of Primary Key.
        if (!isPrimaryKey) {
          const tmpModelData = {
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
            const fieldName = `${singleFieldName}By${_.upperFirst(pkey.name)}`;
            fields[fieldName] = this.processModelData(tmpModelData);
          } else if (pkey.constraints.required) {
            const fieldName = `${pluralize(singleFieldName)}By${_.upperFirst(pkey.name)}`;
            // TODO: Change the Return type to array.
            fields[fieldName] = this.processModelData(tmpModelData, true, false);
          }
        }
      }
    });

    return fields;
  }

  prepareArgsForModel(modelData, fields, mutationOpts) {
    const args = {};

    _.each(modelData.primaryKeys, pkey => {
      const pkeyField = fields[pkey];
      if (pkeyField.type && pkeyField.type instanceof GraphQLScalarType) {
        const fieldGraphType = pkeyField.type; //jsonSchemaUtils.scalarToGraphQLType(pkeyField.type.name);

        if (fieldGraphType) {
          args[pkey] = {
            type: new GraphQLNonNull(fieldGraphType)
          };
        }
      }
    });

    // TODO:; Handle different scenarios.
    if (mutationOpts === 'create' || mutationOpts === 'update') {
      // for mutation include required fields
      _.each(modelData.properties, pkey => {
        const pkeyField = fields[pkey.name];
        if (pkey.constraints) {
          if (pkey.constraints.autoincrement && mutationOpts === 'create') {
            delete args[pkey.name];
          } else if ((pkey.constraints.unique || pkey.constraints.required)) {
            if (pkeyField && !args[pkey.name]) {
              if (mutationOpts === 'create') {
                args[pkey.name] = {
                  type: new GraphQLNonNull(pkeyField.type)
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

  prepareOperatorArgsForModel(modelData) {
    const args = {};

    _.each(modelData.properties, (pkey) => {
      const graphDataType = jsonSchemaUtils.primitiveToGraphQLType(pkey.type);

      if (graphDataType) {
        const typeInfo = {
          type: graphDataType
        };

        const typeInfoArray = {
          type: new GraphQLList(graphDataType)
        };

        const operatorsMap = argsFactory.operatorsMap(pkey.type);
        // contains key as suffix and value to figure out if this operation applies on array or not.
        const operatorSuffices = _.transform(_.values(operatorsMap), (result, value) => {
          result[value.suffix] = value.isArray;
        }, {});

        _.each(operatorSuffices, (value, key) => {
          if (key !== '_IsNull') {
            args[pkey.name + key] = value ? typeInfoArray : typeInfo;
          } else {
            args[pkey.name + key] = {
              type: jsonSchemaUtils.primitiveToGraphQLType('boolean')
            };
          }
        });
      }
    });
    return args;
  }

  getPropsEnumForModel(tableName) {
    const propsEnumName = argsFactory.getPropsEnumNameForModel(tableName);
    return this.modelTypeDefs[propsEnumName];
  }

  prepareSortArgsForModel(tableName) {
    const typeInfo = {
      type: this.getPropsEnumForModel(tableName)
    };

    const retValue = {
      sortBy: typeInfo,
      sortByDesc: typeInfo
    };
    return retValue;
  }

  rootSingleField(modelData, fields, mutationOpts) {
    let resolveHandler;

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

    const retValue = {
      type: this.typeForModel(modelData, fields, mutationOpts),
      args: this.prepareArgsForModel(modelData, fields, mutationOpts),
      resolve: resolveHandler
    };
    return retValue;
  }

  rootListField(modelData, fields, skipReqArgs) {
    const retValue = {
      type: new GraphQLList(this.typeForModel(modelData, fields)),
      args: _.assign({},
        skipReqArgs ? {} : this.prepareArgsForModel(modelData, fields),
        skipReqArgs ? this.prepareOperatorArgsForModel(modelData) : {},
        argsFactory.preparePaginationArgsForModel(),
        this.prepareSortArgsForModel(modelData.tableName)),
      resolve: this.resolver.read()
    };
    return retValue;
  }

  // eslint-disable-next-line class-methods-use-this
  fieldNameForModel(modelClass) {
    return utils.typeNameForModel(modelClass);
  }

  typeForModel(modelData, fields, mutationOpts) {
    let typeName = this.fieldNameForModel(modelData.tableName);
    typeName = _.isEmpty(mutationOpts) ? typeName : _.upperFirst(mutationOpts) + typeName;

    if (!this.modelTypeDefs[typeName]) {
      this.modelTypeDefs[typeName] = new GraphQLObjectType({
        name: typeName,
        fields: this.fetchFields(modelData, fields, mutationOpts)
      });
    }

    return this.modelTypeDefs[typeName];
  }

  // Handle different types for different operations - select and mutations.
  fetchFields(modelData, fields, mutationOpts) {
    let fieldFunctions;

    switch (mutationOpts) {
      case 'create':
      case 'update':
        fieldFunctions = () => _.extend({},
          // attrFields of modelData
          fields
        );
        break;
      case 'delete':
        fieldFunctions = () => _.extend({},
          // pick only primary key fields exposed in delete operation.
          _.pick(fields, modelData.primaryKeys)
        );
        break;
      default:
        fieldFunctions = () => _.extend({},
          // attrFields of modelData
          fields,
          // Relational Fields
          this.relationFields(modelData)
        );
        break;
    }

    return fieldFunctions;
  }

  relationFields(modelData) {
    const fields = {};

    _.forOwn(modelData.foreignKeys, (relation) => {
      const joinTableName = this.fieldNameForModel(relation.reference.resource);
      fields[relation.name] = this.relationField(joinTableName, relation);
    });

    return fields;
  }

  relationField(joinTableName, relation) {
    const type = this.typeForModel({
      tableName: joinTableName
    });

    let graphType = type;
    let args = {};
    let foreignKey = relation.reference.fields;
    if (pluralize(relation.name) === relation.name) {
      graphType = new GraphQLList(type);
      foreignKey = relation.reference.fields; // relation.fields;
      args = _.assign({},
        argsFactory.preparePaginationArgsForModel(),
        this.prepareSortArgsForModel(joinTableName)
      );
    }

    const typeField = {
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

  prepareMutationFields(mutationOpts) {
    const fields = {};

    // Handle only for Single Model.
    _.forOwn(this.models, (modelData) => {
      const singleFieldName = this.getSingleFieldName(modelData);
      fields[_.upperFirst(mutationOpts) + singleFieldName] = this.processModelData(modelData, false, false, mutationOpts);
    });

    return fields;
  }

  addCustomQueryFunction(functionTest) {
    _.assign(this.customQueryFunctions, functionTest);
    return this;
  }

  addCustomMutationFunction(functionTest) {
    _.assign(this.customMutationFunctions, functionTest);
    return this;
  }

  build() {
    // validate all the schema Files, atleast one schema file must be present.
    if (_.isEmpty(this.schemaDefs)) {
      throw new Error('Need atleast one Schema file');
    }

    // validate all the schemas
    // await Promise.all(_.map(this.schemaDefs, JSONSchemaValidator));

    const query = new GraphQLObjectType({
      name: 'Query',
      description: 'Query description',
      fields: () => _.assign({}, this.prepareQueryFields(), this.customQueryFunctions)
    });

    const mutation = new GraphQLObjectType({
      name: 'Mutation',
      description: 'Mutation description',
      fields: () => _.assign({},
        this.prepareMutationFields('create'),
        this.prepareMutationFields('update'),
        this.prepareMutationFields('delete')
      )
    });

    // Prepare Query Schema..
    const retValue = new GraphQLSchema({
      query,
      mutation
    });

    return retValue;
  }
}

module.exports = SchemaBuilder;
