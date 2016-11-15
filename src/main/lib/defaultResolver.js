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

  relation(schemaDef, relation) {
    const knex = this.knex;
    return (parent, args, options, info) => {
      console.log('relation called');
      return this.returnResults(info);
    };
  }

  read(schemaDef) {
    return (parent, args, options, info) => {
      console.log('read called');
      return this.returnResults(info);
    };
  }

  // count(schemaDef) {
  //   return (parent, args, options, info) => {
  //     console.log('count called');
  //     return 0;
  //   };
  // }

  create(schemaDef) {
    return (parent, args, options, info) => {
      console.log('create called');
      return this.returnResults(info);
    };
  }

  update(schemaDef) {
    return (parent, args, options, info) => {
      console.log('update called');
      return this.returnResults(info);
    };
  }

  delete(schemaDef) {
    return (parent, args, options, info) => {
      console.log('delete called');
      return this.returnResults(info);
    };
  }
}
