import _ from 'lodash';
import {
  GraphQLList
} from 'graphql';
import QueryBuilder from './queryBuilder';

export default class Resolver {
  constructor(knex) {
    this.knex = knex;
  }

  returnResults(result, info) {
    // A fix for test cases, pg seems to return rows in result hash, whereas sqlite in result.
    // console.log('result ::', result);
    const results = result.rows || result;
    return (info.returnType instanceof GraphQLList) ? results : _.head(results);
  }

  executeQuery(schemaDef, queryString, options, info) {
    if (options && options.dataLoader) {
      return options.dataLoader.load(queryString).then((result) => this.returnResults(result, info));
    }
    return this.knex.raw(queryString).then((result) => this.returnResults(result, info));
  }

  relation(schemaDef, relation) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const query = QueryBuilder.buildSelect(info.fieldASTs, knex, info, args)
          .where({
            [relation.foreignKey]: parent[relation.foreignKeyValue]
          });

        const queryString = knex.raw(query.toString(), args).toString();
        return this.executeQuery(schemaDef, queryString, options, info);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }

  read(schemaDef) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const query = QueryBuilder.buildSelect(info.fieldASTs, knex, info, args);
        const queryString = knex.raw(query.toString(), args).toString();
        return this.executeQuery(schemaDef, queryString, options, info);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }

  count(schemaDef) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      try {
        const query = QueryBuilder.buildSelect(info.fieldASTs, knex, info, args);
        query.count('1 as count').from(schemaDef.tableName);
        const queryString = knex.raw(query.toString(), args).toString();
        return this.knex.raw(queryString).then((result) => this.returnResults(result, info).count);
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
        return knex(schemaDef.tableName).insert(args, ['*']).then((result) =>
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
        return query.update(updateArgs, ['*']).then((result) => this.returnResults(result, info));
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
        _.each(args, (value, arg) => query.where(arg, value))
        return query.delete('*').then((result) => this.returnResults(result, info));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('error occurred in object() :: ', err);
        throw err;
      }
    };
  }
}
