import SchemaBuilder from './lib/SchemaBuilder';

module.exports = {
  builder: resolver => new SchemaBuilder(resolver)
};
