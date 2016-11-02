export default {
  data: {
    user: [{
      // id: 1,
      userName: 'user1',
      email: 'user1@email.com',
      gender: 'Male',
      ignoreField: 'ignoreField1'
    }, {
      // id: 2,
      userName: 'user2',
      email: 'user2@email.com',
      gender: 'Female',
      ignoreField: 'ignoreField2',
      parentId: 1
    }, {
      // id: 3,
      userName: 'user3',
      email: 'user3@email.com',
      gender: 'Male',
      ignoreField: 'ignoreField3',
      parentId: 1
    }],
    movie: [{
      // id: 1,
      userId: 1,
      title: 'Title1'
    }, {
      // id: 2,
      userId: 1,
      title: 'Title2'
    }, {
      // id: 3,
      userId: 2,
      title: 'Title3'
    }]
  },
  scenarios: [{
    description: 'test parameterized queries -- ',
    query: 'query fetchMovieById($junkId: Int) {Movies(limit: $junkId, offset: $junkId) {id title userId } }',
    args: {
      junkId: 1
    },
    expected: {
      Movies: [{
        id: 2,
        userId: 1,
        title: 'Title2'
      }]
    }
  }]
};
