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
  scenarios: [
    // Basic Field Retrieval...
    {
      description: 'basic test with simple field',
      query: 'query {User(id:1) { userName }}',
      expected: {
        User: {
          userName: 'user1'
        }
      }
    }, {
      description: 'basic test with extra fields',
      query: 'query {User(id:2) { userName,id,email }}',
      expected: {
        User: {
          id: 2,
          userName: 'user2',
          email: 'user2@email.com'
        }
      }
    },
    // Invalid Field Request
    {
      description: 'invalid column name',
      query: 'query {User(id:2) { abcd }}',
      expected: {
        message: 'Cannot query field "abcd" on type "User".'
      }
    }, {
      description: 'invalid id type queried',
      query: 'query {User(id:abcd) { userName }}',
      expected: {
        message: 'Argument "id" has invalid value abcd.\nExpected type "Int", found abcd.'
      }
    }, {
      description: 'non-existent id queried',
      query: 'query {User(id:345) { userName }}',
      expected: {
        User: null
      }
    }, {
      description: 'invalid column name',
      query: 'query {User(id:2) { ignoreField }}',
      expected: {
        message: 'Cannot query field "ignoreField" on type "User".'
      }
    },
    // Fetch all Related Movies - without parameters
    {
      description: 'invalid column name',
      query: 'query {User(id:1) { userName,movies }}',
      expected: {
        message: 'Field "movies" of type "[Movie]" must have a selection of subfields. Did you mean "movies { ... }"?'
      }
    }, {
      description: 'user with movies',
      query: 'query {User(id:1) { userName,id,movies{id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          userName: 'user1',
          movies: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }, {
            id: 2,
            userId: 1,
            title: 'Title2'
          }]
        }
      }
    }, {
      description: 'user with movies for second user',
      query: 'query {User(id:2) { userName,email,id,movies{id,userId,title} }}',
      expected: {
        User: {
          id: 2,
          email: 'user2@email.com',
          userName: 'user2',
          movies: [{
            id: 3,
            userId: 2,
            title: 'Title3'
          }]
        }
      }
    }, {
      description: 'user with movies limit 1 offset 0 -- get first movies',
      query: 'query {User(id:1) { userName,email,id,movies(limit:1,offset:0){id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          email: 'user1@email.com',
          userName: 'user1',
          movies: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }]
        }
      }
    }, {
      description: 'user with movies limit 1 offset 1 -- get next set of movies',
      query: 'query {User(id:1) { userName,email,id,movies(limit:1,offset:1){id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          email: 'user1@email.com',
          userName: 'user1',
          movies: [{
            id: 2,
            userId: 1,
            title: 'Title2'
          }]
        }
      }
    }, {
      description: 'user with movies limit 1 offset 10 - outside range...',
      query: 'query {User(id:1) { userName,email,id,movies(limit:1,offset:10){id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          email: 'user1@email.com',
          userName: 'user1',
          movies: []
        }
      }
    }, {
      // TODO: This should have failed...
      description: 'user with movies limit 1 - negative limit...',
      query: 'query {User(id:1) { userName,email,id,movies(limit: -10){id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          email: 'user1@email.com',
          userName: 'user1',
          movies: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }, {
            id: 2,
            userId: 1,
            title: 'Title2'
          }]
        }
      }
    }, {
      // TODO: This should have failed...
      description: 'user with movies offset 1 - negative offset...',
      query: 'query {User(id:1) { userName,email,id,movies(offset: -10){id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          email: 'user1@email.com',
          userName: 'user1',
          movies: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }, {
            id: 2,
            userId: 1,
            title: 'Title2'
          }]
        }
      }
    }, {
      description: 'user with movies limit 1 sortBY title...',
      query: 'query {User(id:1) { userName,email,id,movies(limit:1,sortBy:title){id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          email: 'user1@email.com',
          userName: 'user1',
          movies: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }]
        }
      }
    }, {
      description: 'user with movies limit 1 sortBY title Desc...',
      query: 'query {User(id:1) { userName,email,id,movies(limit:1,sortByDesc:title){id,userId,title} }}',
      expected: {
        User: {
          id: 1,
          email: 'user1@email.com',
          userName: 'user1',
          movies: [{
            id: 2,
            userId: 1,
            title: 'Title2'
          }]
        }
      }
    },
    // List Queries
    // TODO: add default limit to list queries.
    {
      description: 'list queries - Users',
      query: 'query {Users {count items { userName,email,id}}}',
      expected: {
        Users: {
          count: 3,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }, {
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    },
    // Test for Integer field
    {
      description: 'list queries - Users',
      query: 'query {Users(id:3) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id > 2',
      query: 'query {Users(id_Gt : 2) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id >= 2',
      query: 'query {Users(id_Gte : 2) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }, {
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id < 2',
      query: 'query {Users(id_Lt : 2) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id <= 2',
      query: 'query {Users(id_Lte : 2) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id != 3',
      query: 'query {Users(id_Ne : 3) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id in 1',
      query: 'query {Users(id_In : 1) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id in 1,2',
      query: 'query {Users(id_In : [1,2]) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id not in 3',
      query: 'query {Users(id_NotIn : 3) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - id not in 1,2',
      query: 'query {Users(id_NotIn : [1,2]) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - parentId is null',
      query: 'query {Users(parentId_IsNull:true) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - parentId is not null',
      query: 'query {Users(parentId_IsNull:false) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }, {
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    },
    // Check for String Operations...
    {
      description: 'list queries - Users where email is user3@email.com',
      query: 'query {Users(email:"user3@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email > email:"user3@email.com"',
      query: 'query {Users(email_Gt: "user2@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email >= email:"user2@email.com"',
      query: 'query {Users(email_Gte : "user2@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }, {
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email < "user2@email.com"',
      query: 'query {Users(email_Lt : "user2@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email <= "user2@email.com"',
      query: 'query {Users(email_Lte : "user2@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email != "user3@email.com"',
      query: 'query {Users(email_Ne : "user3@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email in "user1@email.com"',
      query: 'query {Users(email_In : "user1@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email in "user1@email.com", "user2@email.com"',
      query: 'query {Users(email_In : ["user1@email.com","user2@email.com"]) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email not in "user3@email.com"',
      query: 'query {Users(email_NotIn : "user3@email.com") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }, {
            id: 2,
            email: 'user2@email.com',
            userName: 'user2'
          }]
        }
      }
    }, {
      description: 'list queries - Users - email not in "user1@email.com","user2@email.com"',
      query: 'query {Users(email_NotIn : ["user1@email.com","user2@email.com"]) { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 3,
            email: 'user3@email.com',
            userName: 'user3'
          }]
        }
      }
    }, {
      description: 'list queries - Users - like is "%ser1@%"',
      query: 'query {Users(email_Like:"%ser1@%") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - like is "user1@"',
      query: 'query {Users(email_Like:"user1@%") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - like ignore case is "UsEr1%"',
      query: 'query {Users(email_LikeNoCase:"UsEr1%") { count items {userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    }, {
      description: 'list queries - Users - like ignore case is "%sEr1%"',
      query: 'query {Users(email_LikeNoCase:"%sEr1%") {count items { userName,email,id}}}',
      expected: {
        Users: {
          count: 1,
          items: [{
            id: 1,
            email: 'user1@email.com',
            userName: 'user1'
          }]
        }
      }
    },
    // Parameterized Queries..
    {
      description: 'list queries - Movies - Parameterized query',
      query: 'query fetchMovieById ($movieId: Int){Movies(id: $movieId){count items {id, title, userId } }}',
      args: {
        movieId: 1
      },
      expected: {
        Movies: {
          count: 1,
          items: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }]
        }
      }
    }, {
      description: 'test parameterized queries -- ',
      query: 'query fetchMovieById($junkId: [Int]) {Movies(id_In: $junkId) {count items {id title userId } }}',
      args: {
        junkId: 1
      },
      expected: {
        Movies: {
          count: 1,
          items: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }]
        }
      }
    }, {
      description: 'test parameterized queries -- ',
      query: 'query fetchMovieById($junkId: [Int]) {Movies(id_In: $junkId) {count items {id title userId } }}',
      args: {
        junkId: [1, 2]
      },
      expected: {
        Movies: {
          count: 2,
          items: [{
            id: 1,
            userId: 1,
            title: 'Title1'
          }, {
            id: 2,
            userId: 1,
            title: 'Title2'
          }]
        }
      }
    }, {
      description: 'test parameterized queries -- limit and offset',
      query: 'query fetchMovieById($junkId: Int) {Movies(limit: $junkId, offset: $junkId) {count items {id title userId } }}',
      args: {
        junkId: 1
      },
      expected: {
        Movies: {
          count: 3,
          items: [{
            id: 2,
            userId: 1,
            title: 'Title2'
          }]
        }
      }
    },
    // Test Aliases Support
    {
      description: 'test aliases',
      query: 'query {maleUsers: Users(gender: "Male") {count items {id }} femaleUsers: Users(gender: "Female") {count items {id email } }}',
      expected: {
        femaleUsers: {
          count: 1,
          items: [{
            id: 2,
            email: 'user2@email.com'
          }]
        },
        maleUsers: {
          count: 2,
          items: [{
            id: 1
          }, {
            id: 3
          }]
        }
      }
    },
    // Test Fragment Support
    {
      description: 'test fragments',
      query: '{maleUsers: Users(gender: "Male") {...comparisonFields } femaleUsers: Users(gender: "Female") {...comparisonFields } } fragment comparisonFields on ListUser {count items {id email movies {id title } }}',
      expected: {
        maleUsers: {
          count: 2,
          items: [{
            id: 1,
            email: 'user1@email.com',
            movies: [{
              id: 1,
              title: 'Title1'
            }, {
              id: 2,
              title: 'Title2'
            }]
          }, {
            id: 3,
            email: 'user3@email.com',
            movies: []
          }]
        },
        femaleUsers: {
          count: 1,
          items: [{
            id: 2,
            email: 'user2@email.com',
            movies: [{
              id: 3,
              title: 'Title3'
            }]
          }]
        }
      }
    }
  ]
};
