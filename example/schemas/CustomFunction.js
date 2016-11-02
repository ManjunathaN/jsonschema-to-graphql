var GraphQLInt = require('graphql').GraphQLInt;

var count = 123;
module.exports = {
  count: {
    type: GraphQLInt,
    resolve: function() {
      return count;
    }
  }
};
