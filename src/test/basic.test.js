import _ from 'lodash';
import {
  graphql
} from 'graphql';
import assert from 'assert';
import mainModule from '../main/graphql';
import loader from '../main/knex-resolver/queryDataLoader';
import Resolver from '../main/knex-resolver';
import testData from './setup/basic.scenarios';

// var testData = require('./setup/debug.scenarios');
const config = {
  client: 'sqlite3',
  dialect: 'sqlite3',
  debug: false,
  useNullAsDefault: true,
  connection: {
    filename: 'testdb.sqlite3'
  }
};
const knex = require('knex')(config);

const graphQLResolver = new Resolver(knex);

describe('integration tests', () => {
  let schema;

  before(async() => {
    await knex.schema.dropTableIfExists('user');
    await knex.schema.dropTableIfExists('movie');

    await knex.schema.createTableIfNotExists('user', (table) => {
      table.increments();
      table.string('userName');
      table.string('email');
      table.string('gender');
      table.integer('parentId');
      table.string('ignoreField');
    });
    await knex.schema.createTableIfNotExists('movie', (table) => {
      table.increments();
      table.string('title');
      table.integer('userId');
    });

    // Load Test Data...
    _.each(testData.data, async(value, key) => {
      await knex(key).insert(value);
    });

    schema = mainModule
      .builder({
        resolver: graphQLResolver
      })
      .addSchema(require('../../example/schemas/User'), {
        exclude: ['ignoreField']
      })
      .addSchema(require('../../example/schemas/Movie'), {})
      .build();
    return true;
  });

  Promise.all(testData.scenarios.map(async(testCase) => {
    it(`${testCase.description}`, async() => {
      const res = await graphql(schema, testCase.query, null, null, testCase.args);
      if (res.errors) {
        assert.equal(res.errors[0].message, testCase.expected.message, testCase.description);
      } else {
        assert.deepEqual(res.data, testCase.expected, testCase.description);
      }
    });
  }));

  Promise.all(testData.scenarios.map(async(testCase) => {
    it(`DataLoader ::${testCase.description}`, async() => {
      const dataLoader = loader.queryDataLoader(knex);
      const res = await graphql(schema, testCase.query, null, {
        dataLoader
      }, testCase.args);
      if (res.errors) {
        assert.equal(res.errors[0].message, testCase.expected.message, testCase.description);
      } else {
        assert.deepEqual(res.data, testCase.expected, testCase.description);
      }
    });
  }));
});
