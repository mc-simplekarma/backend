var
  Twit,
  Conflab,
  mongoose,

  loadConfiguration,
  connectToMongoose,
  twitterStreamProccesor,

  createTweetProcessor;

runIt = true;
async = require('async');
mongoose = require('mongoose');
Conflab = require('conflab');
Twit = require('twit');
createTweetProcessor = require('./tweet-processor');

loadConfiguration = function(callback) {
  var
    conflab;

  conflab = new Conflab();
  conflab.load(function(err, config) {
    if (err) {
      callback(err);
    } else {
      callback(null, config);
    }
  });
};

connectToMongoose = function(config, callback) {
  var
    db,
    createEndpoint;

  createEndpoint = function(config) {
    if (config.auth.username && config.auth.password) {
      return 'mongodb://' + config.auth.username + ':' + config.auth.password + '@' + config.auth.server + '/' + config.auth.database + '';
    } else {
      return 'mongodb://' + config.auth.server + '/' + config.auth.database + '';
    }
  };

  mongoose.connect(createEndpoint(config.mongo));
  db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function (err) {
    console.log('Mongodb connected.');
    if (err) {
      callback(err);
    } else {
      callback(null, config, mongoose);
    }
  });
};

twitterStreamProccesor = function(config, mongoose, callback) {
  var
    T,
    stream;

  T = new Twit({
    consumer_key: 'fB9nMTsiOlb52ikGgwplOZcvs',
    consumer_secret: 'x4aGLxzsL3uxYBqEldUTuCREPYbl6anv31wY0L6vKcNv4IUH8G',
    //app_only_auth:        true
    access_token: '1958975024-BxI0corqubiB2MLE9nX6NjeYqJjQpTCAY4AqZnt',
    access_token_secret: 'GlwgqJtUUnaBnC7mC3pgFDQjtNdCjIVbPvLdLEnmaWinZ'
  });

  stream = T.stream('statuses/filter', {track: config.hashtag});

  stream.on('connect', function (request) {
    console.log('TWITTER CONNECT: ' + request);
  });

  callback(null, {
    stream: stream,
    config: config,
    mongoose: mongoose
  });
};


// Start proccesing.

async.waterfall(
  [
    loadConfiguration,
    connectToMongoose,
    twitterStreamProccesor
  ],
  function(err, results) {
    if (err) {
      console.log('Failed.');
    } else {
      results.stream.on('tweet', createTweetProcessor(results.config, results.mongoose));
    }
  }
);