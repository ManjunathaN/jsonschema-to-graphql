'use strict';

var _dataloader = require('dataloader');

var _dataloader2 = _interopRequireDefault(_dataloader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: loader to be at request level instead of global...need to pass this in req.
// if loader is three...then use it else use knex directly.
// https://github.com/applification/graphql-loader/blob/master/src/index.js
// https://github.com/facebook/dataloader/commit/175cb3f0414514f9784d0538df79fb9436084519
// TODO: Move this at request level instead of global.
module.exports = {
  queryDataLoader: function queryDataLoader(knex) {
    return new _dataloader2.default(function (keys) {
      return Promise.all(keys.map(function (key) {
        return knex.raw(key);
      }));
    }, {
      // Make sure we use a `WeakMap` for the cache so old `Client`s are not held in memory.
      // Can also make use of Redis here.
      cache: new WeakMap()
    });
  }
};