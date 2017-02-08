var mongoose = require('mongoose');

var spaceSchema = mongoose.Schema({
    roomId: String,
    roomType: String,
    personName: String,
    personEmail: String,
    nickName: String,
    macReports: {
      receive: String ,
      tags: [String]
    },
    splunkReports: {
      receive: String
    },
    windowsReports: {
      receive: String,
      tags: [String]
    }

});


spaceSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

spaceSchema.methods.unInitSelf = function(){
  this.roomId = "";
  this.roomType = "";
  this.personName = "";
  this.personEmail = "";
  this.nickName = "";
  this.macReports.receive ="";
  this.macReports.tags = [""];
  this.splunkReports.receive  = "";
  this.windowsReports.receive = "";
  this.windowsReports.tags = "";
};

spaceSchema.methods.updateTempSpace = function(tempSpace){
      this.roomId = tempSpace.roomId;
      this.roomType = tempSpace.roomType;
      this.personName = tempSpace.person.displayName;
      this.personEmail = tempSpace.personEmail;
      this.nickName = tempSpace.person.nickName;
}

spaceSchema.statics.deleteUser = function (user, bot, callback) {

  var reply = {
    "id" : "0",
    "question" : "none",
    "response" : ""
  };

  this.find({personEmail: user.personEmail}).remove().exec(function(err, data){
    if(err) {
      reply.response = "Error deleting the user, please try again later";
      callback(user, reply, bot);
      next(new Error("Error deleteing the user"));
    }
    else if(data.result.n === 0) {
      reply.response = "User not present in the database";
      callback(user, reply, bot);
      next(new Error("User not registered!"));
    }
    else {
      reply.response = "User deleted from the database";
      callback(user, reply, bot);
    }
  });

}

spaceSchema.statics.insertUser = function (space, bot, callback) {

  var reply = {
    "id" : "0",
    "question" : "none",
    "response" : ""
  };
  console.log("ABOUT TO INSERT USER FROM to the DB");

  this.find({personEmail: space.personEmail}, function(err, result) {
    if (result.length>0){
      space.unInitSelf();
      reply.response = " Already registered, choose another option";
      callback(space, reply, bot);
      next(new Error("User already registered!"));
    }
    else {
      space.save(function(err){
        if (err) {
          reply.response = "error saving the user, try again later";
          callback(space, reply, bot);
        }
        else {
          reply.response = "Welcome to Westworld " + space.nickName + "!";
          callback(space, reply, bot);
        }
          space.unInitSelf();
    })
  }
}).exec();
}

// module.exports = mongoose.model('SparkSpace', spaceSchema);
module.exports = spaceSchema;
