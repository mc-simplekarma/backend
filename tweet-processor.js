'use strict';

module.exports = function(config, mongoose) {
  var
    models,
    processTweet,

    registerUsers,
    tweetLogger,
    checkForOriginalContent,
    checkForReTweet,
    checkForQuote;

  models = require('./models')(mongoose);

  registerUsers = function(tweet, callback) {
    // Check if tweet author exists, if not add it.
    models.User.findOne({userId: tweet.user.id_str}, function(err, user) {
      if (err) {
        callback(err);
      } else {
        if (!user) {
          var
            newUser;

          console.log('User ' + tweet.user.screen_name + ' doesnt exists.');
          newUser = new models.User({
            userId: tweet.user.id_str,
            name: tweet.user.name,
            screen_name: tweet.user.screen_name,
            location: '',
            profile_image_url: tweet.user.profile_image_url,
            isCause: false,
            isDonor: false,
            authToken: ''
          });

          newUser.save(function(errSave, userCreated) {
            if (errSave || !userCreated) {
              callback(errSave);
            } else {
              callback(null, tweet);
            }
          });
        } else {
          callback(null, tweet);
        }
      }
    });
  };

  checkForOriginalContent = function(tweet, callback) {
    if (!tweet.retweeted_status && !tweet.quoted_status) {
      models.CauseContent.findOne({contentId: tweet.id_str}, function(err, content) {
        var
          newContent;

        if (err) {
          callback(err);
        } else {
          if (!content) {
            newContent = new models.CauseContent({
              contentId: tweet.id_str,
              userId: tweet.user.id_str,
              text: tweet.text,
              timestamp: new Date(parseInt(tweet.timestamp_ms))
            });

            newContent.save(function(errSave, contentCreated) {
              if (errSave || !contentCreated) {
                callback(errSave);
              } else {
                console.log('Cause Content: ' + tweet.text);
                callback(null, tweet);
              }
            });
          } else {
            callback(null, tweet);
          }
        }
      });
    } else {
      callback(null, tweet);
    }
  };

  checkForReTweet = function(tweet, callback) {
    if (tweet.retweeted_status) {
      async.waterfall(
        [
          function (callback) {
            callback(null, tweet.retweeted_status);
          },
          registerUsers,
          checkForOriginalContent
        ],
        function (err, retweeted) {
          if (err) {
            callback(err);
          } else {

            callback(null, tweet);
          }
        }
      );
    } else {
      callback(null, tweet);
    }
  };

  checkForQuote = function(tweet, callback) {
    if (tweet.quoted_status) {

      async.waterfall(
        [
          function (callback) {
            callback(null, tweet.quoted_status);
          },
          registerUsers,
          checkForOriginalContent
        ],
        function (err, retweeted) {
          if (err) {
            callback(err);
          } else {
            // TODO Add Vote

            callback(null, tweet);
          }
        }
      );
    } else {
      callback(null, tweet);
    }
  };


  tweetLogger = function(tweet, callback) {
    console.log('TWEET: ' + tweet.text);
    callback(null, tweet);
  };

  processTweet = function(tweet) {
    async.waterfall(
      [
        function(callback) {
          callback(null, tweet);
        },
        registerUsers,
        checkForOriginalContent,
        checkForReTweet,
        checkForQuote,
        tweetLogger
      ],
      function(err, results) {
        if (err) {
          console.log('Error processing tweet');
        } else {
          console.log('Success processing tweet: ' + results.id_str);
        }
      }
    );
  };

  return processTweet;
};