'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  isExcluded: function isExcluded(opt, prop) {
    return opt.include && opt.include.indexOf(prop) === -1 || opt.exclude && opt.exclude.indexOf(prop) !== -1;
  },
  typeNameForModel: function typeNameForModel(tableName) {
    return _lodash2.default.upperFirst(_lodash2.default.camelCase(tableName));
  }
};
module.exports = exports['default'];