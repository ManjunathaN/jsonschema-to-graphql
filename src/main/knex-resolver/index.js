import _ from 'lodash';
import {
  GraphQLList,
  GraphQLObjectType
} from 'graphql';
import Promise from 'bluebird';
import QueryBuilder from './queryBuilder';

export default class Resolver {
  constructor(knex) {
    this.knex = knex;
  }

  returnResults(result, info) {
    // A fix for test cases, pg seems to return rows in result hash, whereas sqlite in result.
    // console.log('result ::', info.returnType);
    const results = result.rows || result;
    if (info.returnType instanceof GraphQLList ||
      (info.returnType instanceof GraphQLObjectType && _.startsWith(info.returnType.name, 'List'))) {
      return results;
    }
    return _.head(results);
  }

  executeQuery(schemaDef, queryString, options, info) {
    if (options && options.dataLoader) {
      return options.dataLoader.load(queryString).then(result => this.returnResults(result, info));
    }
    return this.knex.raw(queryString).then(result => this.returnResults(result, info));
  }

  relation(schemaDef, relation) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const query = QueryBuilder.buildSelect(info.fieldASTs, knex, info, args)
          .where({
            [relation.foreignKey]: parent[relation.foreignKeyValue]
          });
        query.from(relation.tableName);

        const queryString = knex.raw(query.toString(), args).toString();
        return this.executeQuery(schemaDef, queryString, options, info);
      } catch (err) {
        // eslint-disable-next-line no-console
        // console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }

  read(schemaDef) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const query = QueryBuilder.buildSelect(info.fieldASTs, knex, info, args);
        query.from(schemaDef.tableName);
        const queryString = knex.raw(query.toString(), args).toString();
        return this.executeQuery(schemaDef, queryString, options, info);
      } catch (err) {
        // eslint-disable-next-line no-console
        // console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }

  list(schemaDef) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const countQuery = QueryBuilder.buildSelect(info.fieldASTs, knex, info, args);
        countQuery.count('1 as count').from(schemaDef.tableName).limit(Number.MAX_SAFE_INTEGER).offset(0);
        const countQueryString = knex.raw(countQuery.toString(), args).toString();

        const itemQuery = QueryBuilder.buildSelect(info.fieldASTs, knex, info, args);
        itemQuery.from(schemaDef.tableName);
        const itemQueryString = knex.raw(itemQuery.toString(), args).toString();

        // console.log('countQueryString :: ', countQueryString);
        // console.log('itemQueryString :: ', itemQueryString);

        return Promise.join(this.knex.raw(countQueryString),
          this.executeQuery(schemaDef, itemQueryString, options, info),
          (countResult, itemResult) => {
            return {
              count: _.head(this.returnResults(countResult, info)).count,
              items: itemResult
            };
          });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }

  create(schemaDef) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        return knex(schemaDef.tableName).insert(args, ['*']).then(result =>
          this.returnResults(result, info));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }

  update(schemaDef) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const query = knex(schemaDef.tableName);
        // console.log('primaryKeys ::', primaryKeys);
        _.each(schemaDef.primaryKeys, (arg) => {
          console.log(arg, args[arg]);
          query.where(arg, args[arg]);
        });

        const updateArgs = _.omit(args, schemaDef.primaryKeys);

        // console.log('updateArgs :: ', updateArgs);
        if (_.isEmpty(updateArgs)) {
          throw new Error('Nothing to update');
        }
        return query.update(updateArgs, ['*']).then(result => this.returnResults(result, info));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }

  delete(schemaDef) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const query = knex(schemaDef.tableName);
        _.each(args, (value, arg) => query.where(arg, value));
        return query.delete('*').then(result => this.returnResults(result, info));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }
}
