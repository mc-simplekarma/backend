'use strict';

var
  mongoose;

module.exports = function(mongoose) {
  var
    schemas;

  schemas = {
    UserSchema: mongoose.Schema({
      userId: {type: String, required: true, index: true, unique: true},

      name: String,
      screen_name: String,
      location: String,
      profile_image_url: String,

      isCause: Boolean,
      isDonor: Boolean,
      authToken: String
    }),

    CauseContentSchema: mongoose.Schema({
      contentId: {type: String, required: true, index: true, unique: true},
      userId: String,
      text: String,
      timestamp: Date
    }),

    FundsSchema: mongoose.Schema({
      fundsId: {type: String, required: true, index: true, unique: true},
      userId: String,
      amount: String,
      timestamp: Date
    }),

    VoteSchema: mongoose.Schema({
      voteId: {type: String, required: true, index: true, unique: true},
      userId: {type: String, index: true},
      contentId: {type: String, index: true},
      text: String,
      timestamp: Date
    }),

    RaisedSchema: mongoose.Schema({
      userId: {type: String, required: true, index: true},
      donorId: {type: String, required: true, index: true},
      contentId: {type: String, required: true, index: true},
      amount: String,
      timestamp: Date
    })
  };

  return {
    User: mongoose.model('TwitterUser', schemas.UserSchema),
    CauseContent: mongoose.model('CauseContent', schemas.CauseContentSchema),
    Funds: mongoose.model('Funds', schemas.FundsSchema),
    Vote: mongoose.model('Vote', schemas.VoteSchema),
    Raised: mongoose.model('Raised', schemas.RaisedSchema)
  };
};
