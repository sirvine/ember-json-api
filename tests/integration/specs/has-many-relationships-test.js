var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/has-many-relationships-test', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            comments: {
              self: '/posts/1/links/comments',
              related: '/posts/1/comments',
              linkage: [{
                type: 'comments',
                id: '1'
              },{
                type: 'comments',
                id: '2'
              }]
            }
          }
        },
        included: [
          {
            type: 'comments',
            id: '1',
            title: 'good article',
            body: 'ideal for my startup'
          },
          {
            type: 'comments',
            id: '2',
            title: 'bad article',
            body: 'doesn\'t run Crysis'
          }
        ]
      },
      post_1_comments: {
        data: [
          {
            type: 'comments',
            id: '1',
            title: 'good article',
            body: 'ideal for my startup'
          },
          {
            type: 'comments',
            id: '2',
            title: 'bad article',
            body: 'doesn\'t run Crysis'
          }
        ]
      }
    };

    env = setupStore(setModels());
    env.store.modelFor('post');
    env.store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest('GET /posts/1 with comments and reload comments', function() {
  var models = setModels({
    commentAsync: true
  });
  var commentsUrl = '/posts/1/comments';
  var commentsQueries = 0;

  env = setupStore(models);
  fakeServer.pretender.handledRequest = function(verb, path, request) {
    console.log('handling request');
    if(path === commentsUrl) { ++commentsQueries; }
  };
  fakeServer.get('/posts/1', responses.posts);
  fakeServer.get(commentsUrl, responses.post_1_comments);

  Em.run(function() {
    console.log('about to get post');
    env.store.find('post', '1').then(function(record) {
      console.log('got post', record);
      record.get('comments').then(function(comments) {
        console.log('got comments', comments);
        var comment1 = comments.objectAt(0);
        var comment2 = comments.objectAt(1);

        equal(comments.get('length'), 2, 'there are 2 comments');

        equal(comment1.get('title'), 'good article', 'comment1 title');
        equal(comment1.get('body'), 'ideal for my startup', 'comment1 body');
        equal(comment2.get('title'), 'bad article', 'comment2 title');
        equal(comment2.get('body'), "doesn't run Crysis", 'comment2 body');

        //record.get('comments').reload();

        equal(commentsQueries, 1, 'comments should only be called after reload');
        start();
      }, function() {
        console.log('test error', arguments);
        start();
      });
    });
  });
});
