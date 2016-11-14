'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _graphql = require('graphql');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Resolver = function () {
  function Resolver() {
    (0, _classCallCheck3.default)(this, Resolver);
  }

  (0, _createClass3.default)(Resolver, [{
    key: 'returnResults',
    value: function returnResults(info) {
      // A fix for test cases, pg seems to return rows in result hash, whereas sqlite in result.
      // console.log('result ::', result);
      return info.returnType instanceof _graphql.GraphQLList ? [] : {};
    }
  }, {
    key: 'relation',
    value: function relation(schemaDef, _relation) {
      var _this = this;

      var knex = this.knex;
      return function (parent, args, options, info) {
        console.log('relation called');
        return _this.returnResults(info);
      };
    }
  }, {
    key: 'read',
    value: function read(schemaDef) {
      var _this2 = this;

      return function (parent, args, options, info) {
        console.log('read called');
        return _this2.returnResults(info);
      };
    }
  }, {
    key: 'count',
    value: function count(schemaDef) {
      return function (parent, args, options, info) {
        console.log('count called');
        return 0;
      };
    }
  }, {
    key: 'create',
    value: function create(schemaDef) {
      var _this3 = this;

      return function (parent, args, options, info) {
        console.log('create called');
        return _this3.returnResults(info);
      };
    }
  }, {
    key: 'update',
    value: function update(schemaDef) {
      var _this4 = this;

      return function (parent, args, options, info) {
        console.log('update called');
        return _this4.returnResults(info);
      };
    }
  }, {
    key: 'delete',
    value: function _delete(schemaDef) {
      var _this5 = this;

      return function (parent, args, options, info) {
        console.log('delete called');
        return _this5.returnResults(info);
      };
    }
  }]);
  return Resolver;
}();

exports.default = Resolver;
module.exports = exports['default'];