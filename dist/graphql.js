'use strict';

var _SchemaBuilder = require('./lib/SchemaBuilder');

var _SchemaBuilder2 = _interopRequireDefault(_SchemaBuilder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  builder: function builder(resolver) {
    return new _SchemaBuilder2.default(resolver);
  }
};