import _ from 'lodash';
import {
  GraphQLEnumType,
  GraphQLScalarType
} from 'graphql';
import jsonSchemaUtils from './jsonSchemaUtils';

const self = module.exports = {
  buildBasicOperator(name, suffix, condition, isArray = false) {
    return {
      name,
      suffix,
      condition,
      isArray
    };
  },

  basicOperatorsMap() {
    return {
      '=': self.buildBasicOperator('equals', '', '?? = ?'),
      IS_NULL: self.buildBasicOperator('is null', '_IsNull', '?? IS NULL')
    };
  },

  numericOperatorsMap() {
    return _.merge({
      '>': self.buildBasicOperator('greater than', '_Gt', '?? > ?'),
      '>=': self.buildBasicOperator('greater than equals', '_Gte', '?? >= ?'),
      '<': self.buildBasicOperator('less than', '_Lt', '?? < ?'),
      '<=': self.buildBasicOperator('less than equals', '_Lte', '?? <= ?'),
      '<>': self.buildBasicOperator('not equals', '_Ne', '?? <> ?'),
      IN: self.buildBasicOperator('in', '_In', '?? IN (?)', true),
      NOT_IN: self.buildBasicOperator('not in', '_NotIn', '?? NOT IN (?)', true)
    }, self.basicOperatorsMap());
  },

  stringOperatorsMap() {
    return _.merge({
      LIKE: self.buildBasicOperator('like', '_Like', '?? LIKE ?'),
      LIKE_IG: self.buildBasicOperator('like ignore case', '_LikeNoCase', 'LOWER(??) LIKE ?')
    }, self.numericOperatorsMap());
  },

  // https://technet.microsoft.com/en-in/library/cc765953(v=ws.10).asp
  operatorsMap(type) {
    let returnValue = {};

    switch (type.toLowerCase()) {
      case 'boolean':
        returnValue = this.basicOperatorsMap();
        break;
      case 'string':
        returnValue = this.stringOperatorsMap();
        break;
      case 'integer':
      case 'number':
        returnValue = this.numericOperatorsMap();
        break;
      default:
        break;
    }
    return returnValue;
  },

  getSuffixMapForType() {
    const returnValue = this.stringOperatorsMap();

    const xxx = {};
    _.each(returnValue, (value) => {
      if (!_.isEmpty(value.suffix)) {
        xxx[value.suffix] = value.condition;
      }
    });

    return xxx;
  },

  // TODO: Need to change this..but hope its okay for now.
  preparePaginationArgsForModel() {
    const args = {};

    const typeInfo = {
      type: jsonSchemaUtils.primitiveToGraphQLType('integer')
    };
    args.limit = typeInfo;
    args.offset = typeInfo;

    return args;
  },

  getPropsEnumNameForModel(tableName) {
    const propsEnumName = `${_.upperFirst(_.camelCase(tableName))}PropertiesEnum`;
    return propsEnumName;
  },

  // Needs to be called even before any other operation
  preparePropsEnumForModel(modelData) {
    const typeName = self.getPropsEnumNameForModel(modelData.tableName);

    const values = {};
    _.each(modelData.properties, (pkey) => {
      const graphDataType = jsonSchemaUtils.primitiveToGraphQLType(pkey.type);
      if (graphDataType && graphDataType instanceof GraphQLScalarType) {
        values[pkey.name] = {
          value: pkey.name
        };
      }
    });

    const propEnumType = new GraphQLEnumType({
      name: typeName,
      values
    });

    return propEnumType;
  }
};
