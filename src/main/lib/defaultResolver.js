import {
  GraphQLList
} from 'graphql';

export default class Resolver {
  constructor() {}

  returnResults(info) {
    // A fix for test cases, pg seems to return rows in result hash, whereas sqlite in result.
    // console.log('result ::', result);
    return (info.returnType instanceof GraphQLList) ? [] : {};
  }

  relation(relation) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      console.log('relation called');
      return this.returnResults(info);
    };
  }

  read() {
    return (parent, args, options, info) => {
      console.log('read called');
      return this.returnResults(info);
    };
  }

  create(tableName) {
    return (parent, args, options, info) => {
      console.log('create called');
      return this.returnResults(info);
    };
  }

  update(tableName, primaryKeys) {
    return (parent, args, options, info) => {
      console.log('update called');
      return this.returnResults(info);
    };
  }

  delete(tableName) {
    return (parent, args, options, info) => {
      console.log('delete called');
      return this.returnResults(info);
    };
  }
}
