var Express = require('express');
var GraphHTTP = require('express-graphql');
var GraphQL = require('../');
var loader = require('../dist/knex-resolver/queryDataLoader');
var Resolver = require('../dist/knex-resolver');

var knex = require('knex')({
  client: 'sqlite3',
  dialect: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: 'testdb.sqlite3'
  }
});

// Load data..
Promise.all([
  knex.schema.dropTableIfExists('user'),
  knex.schema.dropTableIfExists('movie'),
  knex.schema.createTableIfNotExists('user', function(table) {
    table.increments();
    table.string('userName');
    table.string('email');
    table.string('gender');
    table.integer('parentId');
    table.string('ignoreField');
  }),
  knex.schema.createTableIfNotExists('movie', function(table) {
    table.increments();
    table.string('title');
    table.integer('userId');
  })
])

var resolver = new Resolver(knex);

// Start
var app = Express();
var graphQlBuilder = GraphQL.builder({
  // resolver,
  skipConstraintModels: false,
  skipOperatorFields: false,
  skipPaginationFields: false,
  skipSortByFields: false
});

// This is all you need to do to generate the schema.
var graphQlSchema = graphQlBuilder
  .addSchema(require('./schemas/User'), {
    exclude: ['ignoreField']
  })
  .addSchema(require('./schemas/Movie'), {})
  .addCustomQueryFunction(require('./schemas/CustomFunction'))
  .build();

function graphqlSettingsPerRequest(req, res) {
  return {
    schema: graphQlSchema,
    graphiql: true,
    pretty: true,
    context: {
      // request: req, // just for example, pass request to context
      // dataLoader: loader.queryDataLoader(knex),
    }
  }
}

// Declare standard graphql route
app.use('/graphql', GraphHTTP(graphqlSettingsPerRequest));

var APP_PORT = 3000;
app.listen(APP_PORT, function() {
  console.log(`App listening on port ${APP_PORT}`);
});
