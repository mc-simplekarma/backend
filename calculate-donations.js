var
  Conflab,
  mongoose,
  lodash,
  Decimal,

  loadConfiguration,
  connectToMongoose,
  calculateDonations;

async = require('async');
mongoose = require('mongoose');
Conflab = require('conflab');
_ = require('lodash');
Decimal = require('decimal');

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

calculateDonations = function(config, mongoose, callback) {
  var
    models,
    checkFunds;

  models = require('./models')(mongoose);

  checkFunds = function(user, callback) {
    models.Funds.find({userId: user.userId}, function(err, funds) {
      var
        fundsTotal;

      if (err) {
        callback(err);
      } else {
        if (funds.length > 0) {
          console.log('User have funds: ' + user.screen_name);
          // Funds total
          fundsTotal = _.reduce(funds, function(total, n) {
            return total.add(Decimal(n.amount));
          }, Decimal(0));
          console.log('Amount: ' + fundsTotal.toString());

          // Find Votes and give to those causes
          models.Vote.count({userId: user.userId}, function(err, voteCount) {
            var
              voteValue;

            if (err) {
              callback(err);
            } else {
              if (voteCount > 0) {
                voteValue = fundsTotal.div(Decimal(voteCount));
                console.log(user.screen_name + ' ' + voteCount + ' Vote(s), vote value : $' + voteValue.toString());
                // Listing Votes
                models.Vote.find({userId: user.userId}, function(errVotes, votes) {
                  var
                    raised;

                  if (errVotes) {
                    callback(errVotes);
                  } else {
                    async.each(
                      votes,
                      function(vote, callback) {
                        models.CauseContent.findOne({contentId: vote.contentId}, function(errCause, causeContent) {
                          if (errCause) {
                            callback(errCause);
                          } else {
                            if (causeContent) {
                              models.User.findOne({userId: causeContent.userId}, function(errCause, cause) {
                                var
                                  newRaised;

                                if (errCause) {
                                  callback(errCause);
                                } else {
                                  if (cause) {
                                    newRaised = new models.Raised({
                                      userId: cause.userId,
                                      donorId: user.userId,
                                      contentId: causeContent.contentId,
                                      amount: voteValue.toString(),
                                      timestamp: new Date()
                                    });

                                    newRaised.save(function(errSaveRaised, raisedCreated) {
                                      if (errSaveRaised) {
                                        callback(errSaveRaised);
                                      } else {
                                        console.log('Raised $'+voteValue.toString()+' by '+cause.screen_name);
                                        callback();
                                      }
                                    });
                                  } else {
                                    callback();
                                  }
                                }
                              });
                            } else {
                              callback();
                            }
                          }
                        });
                      },
                      function(errVoting) {
                        callback();
                      }
                    );
                  }
                });
              } else {
                callback();
              }
            }
          });
        } else {
          console.log('User doesnt have funds: ' + user.screen_name);
          callback();
        }
      }
    });
  };

  models.User.find({}, function(err, users) {
    if (err) {
      callback(err);
    } else {
      async.each(
        users,
        checkFunds,
        function(errUsers) {
          if (errUsers) {
            callback(errUsers);
          } else {
            callback(null, 'done!');
          }
        }
      );
    }
  });
};

// Start Calculations...

async.waterfall(
  [
    loadConfiguration,
    connectToMongoose,
    calculateDonations
  ],
  function(err, results) {
    if (err) {
      console.log('Failed.');
      process.exit(1);
    } else {
      console.log('Calculations ' + results);
      process.exit(0);
    }
  }
);