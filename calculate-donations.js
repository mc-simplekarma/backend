var
  Conflab,
  mongoose,

  loadConfiguration,
  connectToMongoose,
  calculateDonations;

async = require('async');
mongoose = require('mongoose');
Conflab = require('conflab');

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
  callback(null, 'done!');
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