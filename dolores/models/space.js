var mongoose = require('mongoose');
let Promise = require('promise');

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

  this.find({roomId: user.roomId}).remove().exec(function(err, data){
    if(err) {
      reply.response = "Error deleting the user, please try again later";
      callback(user, reply, bot);
      next(new Error("Error deleteing the user"));
    }
    else if(data.result.n === 0) {
      reply.response = "Space not registered in the database";
      callback(user, reply, bot);
      next(new Error("User not registered!"));
    }
    else {
      reply.response = "Room deleted from the database";
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

  this.find({roomId: space.roomId}, function(err, result, next) {
    if (result.length>0){
      reply.response = " Already registered, choose another option";
      callback(space, reply, bot);
      space.unInitSelf();
      console.log("User already registered!");
    }
    else {
      space.save(function(err){
        if (err) {
          reply.response = "error saving the user, try again later";
          callback(space, reply, bot);
        }
        else {
          if (space.roomType === "group") {
            reply.response = "Welcome to SparkWorld!";
          } else {
            reply.response = "Welcome to SparkWorld " + space.nickName + "!";
          }
          callback(space, reply, bot);
        }
          space.unInitSelf();
    })
  }
}).exec();
}
spaceSchema.statics.showUserOptions = function (space, bot, callback) {
  var reply = {};
  this.find({roomId: space.roomId}, function(err, result, next) {
    if (result.length>0){
      if(space.roomType === "group"){
        reply.response = "These are currently the registration options for this group space " + result[0].nickName + ":" +
                                "\n\n- Receive Spark client crash reports real time: " + "**"+ result[0].macReports.receive + "**"+
                                "\n\n- Crash Reports filter keywords: " + "_"+ result[0].macReports.tags + "_"+
                                "\n\n- You can use this room to display Splunk Alerts:" + "**"+ result[0].splunkReports.receive;
      }
      else{
        reply.response = "These are currently your registration options " + result[0].nickName + ":" +
                                "\n\n- Name: " + "**" +result[0].personName+ "**" +
                                "\n\n- Receive Spark client crash reports real time: " + "**"+ result[0].macReports.receive + "**"+
                                "\n\n- Crash Reports filter keywords: " + "_"+ result[0].macReports.tags + "_"+
                                "\n\n- You can use this room to display Splunk Alerts:" + "**"+ result[0].splunkReports.receive+ "**";
      }

    }
    else {
      reply.response = "You are not yet registered";

  }
  callback(space, reply, bot);
}).exec();
}

spaceSchema.statics.getMacReportSubscribers = function (req, bot, callback){
  console.log("about to parse and send a message to found users");
  var stringToSearch = req.body.payload.title + req.body.payload.method;
  var failureReport = "Mac crash received: " +
                    //"\nevent: " + req.body.event +
                    //"\npayload Type: " + req.body.payload_type +
                    "\n\n- **display ID:** " + req.body.payload.display_id +
                    "\n\n- **title:** " + req.body.payload.title +
                    "\n\n- **method affected:** " + req.body.payload.method +
                    "\n\n- **impact_level:** " + req.body.payload.impact_level  +
                    "\n\n- **crashes_count:** " + req.body.payload.crashes_count +
                    //"\nimpacted_devices_count: " + req.body.payload.impacted_devices_count +
                    "\n\n- **url to the crash:** " + "[fabric link to crash]" + "("+ req.body.payload.url + ")";
  stringToSearch = stringToSearch.toLowerCase();
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
          else{
            tags.forEach(function(tag){
                var position = stringToSearch.indexOf(tag);
                if(position >= 0){
                  console.log("USER FOUND SAVING THE ROOM ID INTO AN ARRAY");
                  roomsIdSet.add(item.roomId);
                }

            })
          }
        })
        for(var roomId of roomsIdSet.values()){
         bot.sendRichTextMessage(roomId,failureReport,function(){
           console.log("user found about to send him a message");
         });
        }
      }
    });
  }

spaceSchema.statics.getSplunkSubscribers = function (req, bot, callback){
    console.log("about to parse and send a message to found users");

    var splunkReport = "Splunk Report received: " +
                      "\n\n- **Result:** " + req.body.result.count +
                      "\n\n- **Search Name:** " + req.body.search_name +
                      "\n\n- **Result link:** " + "[splunk dasboard]" + "("+req.body.results_link +")";

    var owner = req.body.owner;
    this.list(function(err,users){
      if(err){
        console.log("error reading the database");
      }
      else if (users){
        var roomsIds = [];
        users.forEach(function(item){
            var splunkOwner = item.personEmail.split('@');
            if(item.splunkReports.receive === "yes" && splunkOwner[0] === owner){
              roomsIds.push(item.roomId);
            }
          })
       roomsIds.forEach(function(roomId){
           bot.sendRichTextMessage(roomId,splunkReport,function(){
             console.log("user found about to send him a message");
           });
       })
     }
  });
}


spaceSchema.statics.getSplunkUsers = (owner) => {
    console.log("about a non saved query");
    return new Promise((resolve,reject) =>{
      this.list(function(err,users){
        if(err){
          console.log("error reading the database");
          reject(error);
        }
        else if (users){
          var roomsIds = [];
          users.forEach(function(item){
              var splunkOwner = item.personEmail.split('@');
              if(item.splunkReports.receive === "yes" && splunkOwner[0] === owner){
                roomsIds.push(item.roomId);
                console.log("user found about to send him a message");
              }
          })
          resolve(roomsIds);
       }

    });
  })
}


// module.exports = mongoose.model('SparkSpace', spaceSchema);
module.exports = spaceSchema;
