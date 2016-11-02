import {
  GraphQLList
} from 'graphql';
import _ from 'lodash';
import knex from 'knex';
import argsFactory from '../lib/argsFactory';

function updateWhereClause(query, arg, kind, isList = false) {
  // If the column ends with our suffix, then add condition and return.
  const suffixMap = argsFactory.getSuffixMapForType();
  let found = false;

  const values = isList ? _.map(arg.value.values, val => val.value) : arg.value.value;
  const isVarDef = (kind === 'Variable');
  const varValue = `:${arg.name.value}`;

  _.each(suffixMap, (condition, key) => {
    if (_.endsWith(arg.name.value, key) && (!found)) {
      const columnName = _.head(_.split(arg.name.value, key));

      switch (key) {
        case '_IsNull':
          if (arg.value.value) {
            query.whereNull(columnName);
          } else {
            query.whereNotNull(columnName);
          }
          break;
        case '_In':
          query.whereIn(columnName, isVarDef ? knex.raw(varValue) : values);
          break;
        case '_NotIn':
          query.whereNotIn(columnName, isVarDef ? knex.raw(varValue) : values);
          break;
        case '_LikeNoCase':
          query.whereRaw(condition, [columnName,
            isVarDef ? knex.raw(varValue) : values.toLowerCase()
          ]);
          break;
        case '_Like':
          query.whereRaw(condition, [columnName, isVarDef ? knex.raw(varValue) : values]);
          break;
        default:
          // console.log('columnName, values :: ', columnName, values);
          query.whereRaw(condition, [columnName, isVarDef ? knex.raw(varValue) : values]);
          break;
      }

      found = true;
      return false;
    }
  });

  // Its now, safe to assume that this is equals operator..
  if (!found) {
    query.whereRaw('?? = ?', [arg.name.value, isVarDef ? knex.raw(varValue) : values]);
    found = true;
  }

  return found;
}

function findArgType(arg, vardefs) {
  // eslint-disable-next-line eqeqeq
  const vardef = (vardefs || []).find(def => def.variable.name.value == arg.name.value);
  const kind = vardef ? (vardef.type.name ? vardef.type.name.value : vardef.type.type.name.value) :
    (arg.value.kind ? arg.value.kind : 'String');
  return kind;
}

function updateMiscClause(arg, query, userInputArgs) {
  let found = false;
  // Handle LIMIT, SORT, SORT_BY
  const columnName = arg.name.value;
  const columnValue = arg.value.value || userInputArgs[arg.name.value];

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
  const kind = findArgType(arg, vardefs);

  // Handle LIMIT, SORT, SORT_BY
  const isMiscClause = updateMiscClause(arg, query, userInputArgs);
  if (isMiscClause) {
    return;
  }

  // http://facebook.github.io/graphql/#sec-Input-Values
  const found = updateWhereClause(query, arg, kind, (kind === 'List' || kind === 'ListValue'));
  if (!found) {
    throw Error('Unhandled Case.');
  }
}

function handleQuerySelectionSet(field, query, vardefs, options, userInputArgs) {
  field.arguments.map(arg => handleArgument(arg, query, vardefs, userInputArgs));

  let objectName;
  if (options.returnType instanceof GraphQLList) {
    objectName = options.returnType.ofType.name;
  } else {
    objectName = options.returnType ? options.returnType.name : field.name.value;
  }

  query.from(objectName.toLowerCase());
}

module.exports = {
  // Construct SQL query from the GQL AST (graphql abstract syntax tree)
  buildSelect(fields, query, options, userInputArgs) {
    const queryTmp = query.select();
    fields.map(field => handleQuerySelectionSet(
      field,
      queryTmp,
      options.operation.variableDefinitions,
      options, userInputArgs));
    return queryTmp;
  }
};
