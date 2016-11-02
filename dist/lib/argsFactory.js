'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var _jsonSchemaUtils = require('./jsonSchemaUtils');

var _jsonSchemaUtils2 = _interopRequireDefault(_jsonSchemaUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var self = module.exports = {
  buildBasicOperator: function buildBasicOperator(name, suffix, condition) {
    var isArray = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    return {
      name: name,
      suffix: suffix,
      condition: condition,
      isArray: isArray
    };
  },
  basicOperatorsMap: function basicOperatorsMap() {
    return {
      '=': self.buildBasicOperator('equals', '', '?? = ?'),
      IS_NULL: self.buildBasicOperator('is null', '_IsNull', '?? IS NULL')
    };
  },
  numericOperatorsMap: function numericOperatorsMap() {
    return _lodash2.default.merge({
      '>': self.buildBasicOperator('greater than', '_Gt', '?? > ?'),
      '>=': self.buildBasicOperator('greater than equals', '_Gte', '?? >= ?'),
      '<': self.buildBasicOperator('less than', '_Lt', '?? < ?'),
      '<=': self.buildBasicOperator('less than equals', '_Lte', '?? <= ?'),
      '<>': self.buildBasicOperator('not equals', '_Ne', '?? <> ?'),
      IN: self.buildBasicOperator('in', '_In', '?? IN (?)', true),
      NOT_IN: self.buildBasicOperator('not in', '_NotIn', '?? NOT IN (?)', true)
    }, self.basicOperatorsMap());
  },
  stringOperatorsMap: function stringOperatorsMap() {
    return _lodash2.default.merge({
      LIKE: self.buildBasicOperator('like', '_Like', '?? LIKE ?'),
      LIKE_IG: self.buildBasicOperator('like ignore case', '_LikeNoCase', 'LOWER(??) LIKE ?')
    }, self.numericOperatorsMap());
  },


  // https://technet.microsoft.com/en-in/library/cc765953(v=ws.10).asp
  operatorsMap: function operatorsMap(type) {
    var returnValue = {};

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
  getSuffixMapForType: function getSuffixMapForType() {
    var returnValue = this.stringOperatorsMap();

    var xxx = {};
    _lodash2.default.each(returnValue, function (value) {
      if (!_lodash2.default.isEmpty(value.suffix)) {
        xxx[value.suffix] = value.condition;
      }
    });

    return xxx;
  },


  // TODO: Need to change this..but hope its okay for now.
  preparePaginationArgsForModel: function preparePaginationArgsForModel() {
    var args = {};

    var typeInfo = {
      type: _jsonSchemaUtils2.default.primitiveToGraphQLType('integer')
    };
    args.limit = typeInfo;
    args.offset = typeInfo;

    return args;
  },
  getPropsEnumNameForModel: function getPropsEnumNameForModel(tableName) {
    var propsEnumName = _lodash2.default.upperFirst(_lodash2.default.camelCase(tableName)) + 'PropertiesEnum';
    return propsEnumName;
  },


  // Needs to be called even before any other operation
  preparePropsEnumForModel: function preparePropsEnumForModel(modelData) {
    var typeName = self.getPropsEnumNameForModel(modelData.tableName);

    var values = {};
    _lodash2.default.each(modelData.properties, function (pkey) {
      var graphDataType = _jsonSchemaUtils2.default.primitiveToGraphQLType(pkey.type);
      if (graphDataType && graphDataType instanceof _graphql.GraphQLScalarType) {
        values[pkey.name] = {
          value: pkey.name
        };
      }
    });

    var propEnumType = new _graphql.GraphQLEnumType({
      name: typeName,
      values: values
    });

    return propEnumType;
  }
};