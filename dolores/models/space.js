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
  console.log("ABOUT TO INSERT USER to the DB");

  this.find({roomId: space.roomId}, function(err, result) {
    if (result.length>0){
      reply.response = " Already registered, choose another option";
      callback(space, reply, bot);
      space.unInitSelf();
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

spaceSchema.statics.getMacReportSubscribers = function (req, bot, callback){
  console.log("about to parse and send a message to found users");
  var stringToSearch = req.body.payload.title + req.body.payload.method;
  var failureReport = "Mac crash received: " +
                    //"\nevent: " + req.body.event +
                    //"\npayload Type: " + req.body.payload_type +
                    "\ndisplay ID: " + req.body.payload.display_id +
                    "\ntitle: " + req.body.payload.title +
                    "\nmethod affected: " + req.body.payload.method +
                    "\nimpact_level: " + req.body.payload.impact_level  +
                    "\ncrashes_count: " + req.body.payload.crashes_count +
                    //"\nimpacted_devices_count: " + req.body.payload.impacted_devices_count +
                    "\nurl to the crash: " + req.body.payload.url;

  this.list(function(err,users){
    if(err){
      console.log("error reading the database");
    }
    else if (users){
      var roomsIds = [];
      var roomsIdSet = new Set();
      users.forEach(function(item){
          var tags = item.macReports.tags;
          if (tags[0] === "everything"){
            roomsIdSet.add(item.roomId);
          }
          tags.forEach(function(tag){
              var position = stringToSearch.indexOf(tag);
              if(position >= 0){
                console.log("USER FOUND SAVING THE ROOM ID INTO AN ARRAY");
                roomsIdSet.add(item.roomId);
              }

          })
        })
        for(var roomId of roomsIdSet.values()){
         bot.sendMessage(roomId,failureReport,function(){
           console.log("user found about to send him a message");
         });
        }
      }
    });
  }

spaceSchema.statics.getSplunkSubscribers = function (req, bot, callback){
    console.log("about to parse and send a message to found users");

    var splunkReport = "Splunk Report received: " +
                      "\nResult: " + req.body.result.count +
                      "\nSearch Name: " + req.body.search_name +
                      "\nResult link: " + req.body.results_link;
    this.list(function(err,users){
      if(err){
        console.log("error reading the database");
      }
      else if (users){
        var roomsIds = [];
        users.forEach(function(item){
            if(item.splunkReports.receive = "yes"){
              roomsIds.push(item.roomId);
            }
          })
       roomsIds.forEach(function(roomId){
           bot.sendMessage(roomId,splunkReport,function(){
             console.log("user found about to send him a message");
           });
       })
     }
  });
}


// module.exports = mongoose.model('SparkSpace', spaceSchema);
module.exports = spaceSchema;
