'use strict';

var _graphql = require('graphql');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _argsFactory = require('../lib/argsFactory');

var _argsFactory2 = _interopRequireDefault(_argsFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateWhereClause(query, arg, kind) {
  var isList = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  // If the column ends with our suffix, then add condition and return.
  var suffixMap = _argsFactory2.default.getSuffixMapForType();
  var found = false;

  var values = isList ? _lodash2.default.map(arg.value.values, function (val) {
    return val.value;
  }) : arg.value.value;
  var isVarDef = kind === 'Variable';
  var varValue = ':' + arg.name.value;

  _lodash2.default.each(suffixMap, function (condition, key) {
    if (_lodash2.default.endsWith(arg.name.value, key) && !found) {
      var columnName = _lodash2.default.head(_lodash2.default.split(arg.name.value, key));

      switch (key) {
        case '_IsNull':
          if (arg.value.value) {
            query.whereNull(columnName);
          } else {
            query.whereNotNull(columnName);
          }
          break;
        case '_In':
          query.whereIn(columnName, isVarDef ? _knex2.default.raw(varValue) : values);
          break;
        case '_NotIn':
          query.whereNotIn(columnName, isVarDef ? _knex2.default.raw(varValue) : values);
          break;
        case '_LikeNoCase':
          query.whereRaw(condition, [columnName, isVarDef ? _knex2.default.raw(varValue) : values.toLowerCase()]);
          break;
        case '_Like':
          query.whereRaw(condition, [columnName, isVarDef ? _knex2.default.raw(varValue) : values]);
          break;
        default:
          // console.log('columnName, values :: ', columnName, values);
          query.whereRaw(condition, [columnName, isVarDef ? _knex2.default.raw(varValue) : values]);
          break;
      }

      found = true;
      return false;
    }
  });

  // Its now, safe to assume that this is equals operator..
  if (!found) {
    query.whereRaw('?? = ?', [arg.name.value, isVarDef ? _knex2.default.raw(varValue) : values]);
    found = true;
  }

  return found;
}

function findArgType(arg, vardefs) {
  // eslint-disable-next-line eqeqeq
  var vardef = (vardefs || []).find(function (def) {
    return def.variable.name.value == arg.name.value;
  });
  var kind = vardef ? vardef.type.name ? vardef.type.name.value : vardef.type.type.name.value : arg.value.kind ? arg.value.kind : 'String';
  return kind;
}

function updateMiscClause(arg, query, userInputArgs) {
  var found = false;
  // Handle LIMIT, SORT, SORT_BY
  var columnName = arg.name.value;
  var columnValue = arg.value.value || userInputArgs[arg.name.value];

  switch (columnName.toLowerCase()) {
    case 'limit':
      query.limit(parseInt(columnValue, 10));
      found = true;
      break;
    case 'offset':
      query.offset(parseInt(columnValue, 10) || 0);
      found = true;
      break;
    case 'sortby':
      query.orderBy(columnValue, 'ASC');
      found = true;
      break;
    case 'sortbydesc':
      query.orderBy(columnValue, 'DESC');
      found = true;
      break;
    default:
      break;
  }

  return found;
}
/**
 *  name: $nameArg
 *  arg.name.value = name, arg.value.name.value = nameArg
 */
function handleArgument(arg, query, vardefs, userInputArgs) {
  var kind = findArgType(arg, vardefs);

  // Handle LIMIT, SORT, SORT_BY
  var isMiscClause = updateMiscClause(arg, query, userInputArgs);
  if (isMiscClause) {
    return;
  }

  // http://facebook.github.io/graphql/#sec-Input-Values
  var found = updateWhereClause(query, arg, kind, kind === 'List' || kind === 'ListValue');
  if (!found) {
    throw Error('Unhandled Case.');
  }
}

function handleQuerySelectionSet(field, query, vardefs, options, userInputArgs) {
  field.arguments.map(function (arg) {
    return handleArgument(arg, query, vardefs, userInputArgs);
  });

  var objectName = void 0;
  if (options.returnType instanceof _graphql.GraphQLList) {
    objectName = options.returnType.ofType.name;
  } else {
    objectName = options.returnType ? options.returnType.name : field.name.value;
  }

  query.from(objectName.toLowerCase());
}

module.exports = {
  // Construct SQL query from the GQL AST (graphql abstract syntax tree)
  buildSelect: function buildSelect(fields, query, options, userInputArgs) {
    var queryTmp = query.select();
    fields.map(function (field) {
      return handleQuerySelectionSet(field, queryTmp, options.operation.variableDefinitions, options, userInputArgs);
    });
    return queryTmp;
  }
};