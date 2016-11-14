'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var _queryBuilder = require('./queryBuilder');

var _queryBuilder2 = _interopRequireDefault(_queryBuilder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Resolver = function () {
  function Resolver(knex) {
    (0, _classCallCheck3.default)(this, Resolver);

    this.knex = knex;
  }

  (0, _createClass3.default)(Resolver, [{
    key: 'returnResults',
    value: function returnResults(result, info) {
      // A fix for test cases, pg seems to return rows in result hash, whereas sqlite in result.
      // console.log('result ::', result);
      var results = result.rows || result;
      return info.returnType instanceof _graphql.GraphQLList ? results : _lodash2.default.head(results);
    }
  }, {
    key: 'executeQuery',
    value: function executeQuery(schemaDef, queryString, options, info) {
      var _this = this;

      if (options && options.dataLoader) {
        return options.dataLoader.load(queryString).then(function (result) {
          return _this.returnResults(result, info);
        });
      }
      return this.knex.raw(queryString).then(function (result) {
        return _this.returnResults(result, info);
      });
    }
  }, {
    key: 'relation',
    value: function relation(schemaDef, _relation) {
      var _this2 = this;

      var knex = this.knex;
      return function (parent, args, options, info) {
        try {
          var query = _queryBuilder2.default.buildSelect(info.fieldASTs, knex, info, args).where((0, _defineProperty3.default)({}, _relation.foreignKey, parent[_relation.foreignKeyValue]));

          var queryString = knex.raw(query.toString(), args).toString();
          return _this2.executeQuery(schemaDef, queryString, options, info);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('error occurred in object() :: ', err);
          throw err;
        }
      };
    }
  }, {
    key: 'read',
    value: function read(schemaDef) {
      var _this3 = this;

      var knex = this.knex;
      return function (parent, args, options, info) {
        try {
          var query = _queryBuilder2.default.buildSelect(info.fieldASTs, knex, info, args);
          var queryString = knex.raw(query.toString(), args).toString();
          return _this3.executeQuery(schemaDef, queryString, options, info);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('error occurred in object() :: ', err);
          throw err;
        }
      };
    }
  }, {
    key: 'count',
    value: function count(schemaDef) {
      var _this4 = this;

      var knex = this.knex;
      return function (parent, args, options, info) {
        try {
          var query = _queryBuilder2.default.buildSelect(info.fieldASTs, knex, info, args);
          query.count('1 as count').from(schemaDef.tableName);
          var queryString = knex.raw(query.toString(), args).toString();
          return _this4.knex.raw(queryString).then(function (result) {
            return _this4.returnResults(result, info).count;
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('error occurred in object() :: ', err);
          throw err;
        }
      };
    }
  }, {
    key: 'create',
    value: function create(schemaDef) {
      var _this5 = this;

      var knex = this.knex;
      return function (parent, args, options, info) {
        try {
          return knex(schemaDef.tableName).insert(args, ['*']).then(function (result) {
            return _this5.returnResults(result, info);
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('error occurred in object() :: ', err);
          throw err;
        }
      };
    }
  }, {
    key: 'update',
    value: function update(schemaDef) {
      var _this6 = this;

      var knex = this.knex;
      return function (parent, args, options, info) {
        try {
          var _ret = function () {
            var query = knex(schemaDef.tableName);
            // console.log('primaryKeys ::', primaryKeys);
            _lodash2.default.each(schemaDef.primaryKeys, function (arg) {
              console.log(arg, args[arg]);
              query.where(arg, args[arg]);
            });

            var updateArgs = _lodash2.default.omit(args, schemaDef.primaryKeys);

            // console.log('updateArgs :: ', updateArgs);
            if (_lodash2.default.isEmpty(updateArgs)) {
              throw new Error('Nothing to update');
            }
            return {
              v: query.update(updateArgs, ['*']).then(function (result) {
                return _this6.returnResults(result, info);
              })
            };
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('error occurred in object() :: ', err);
          throw err;
        }
      };
    }
  }, {
    key: 'delete',
    value: function _delete(schemaDef) {
      var _this7 = this;

      var knex = this.knex;
      return function (parent, args, options, info) {
        try {
          var _ret2 = function () {
            var query = knex(schemaDef.tableName);
            _lodash2.default.each(args, function (value, arg) {
              return query.where(arg, value);
            });
            return {
              v: query.delete('*').then(function (result) {
                return _this7.returnResults(result, info);
              })
            };
          }();

          if ((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object") return _ret2.v;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log('error occurred in object() :: ', err);
          throw err;
        }
      };
    }
  }]);
  return Resolver;
}();

exports.default = Resolver;
module.exports = exports['default'];