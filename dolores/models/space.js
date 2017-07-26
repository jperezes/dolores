var mongoose = require('mongoose');
let Promise= require('bluebird')
let versions = require('../routes/getClientChannels').versions;
//mongoose.set('debug', true);

var spaceSchema = mongoose.Schema({
    roomId: String,
    roomType: String,
    personName: String,
    personEmail: String,
    nickName: String,
    channels:[String],
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
          reply.response = "error saving the user, try again later" + err;
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
                                "\n\n- You can use this room to display Splunk Alerts:" + "**"+ result[0].splunkReports.receive+ "**";
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
         console.log("nuber of users found:" + roomsIdSet.size);
         bot.sendRichTextMessage(roomId,failureReport,function(){
                  console.log("user found about to send him a message");
                })
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

spaceSchema.statics.getSplunkUsers = function(owner){
    return new Promise((resolve,reject)=>{
      this.list(function(err,users){
        let roomsIds = [];
        if(err){
          reject(error);
        }
        else if (users){
          users.forEach(function(item){
              var splunkOwner = item.personEmail.split('@');
              if(item.splunkReports.receive === "yes" && splunkOwner[0] === owner){
                roomsIds.push(item.roomId);
              }
          })
       }
       resolve(roomsIds);
    });
  })
}


let isChannelRequestedFound = function(channelsRequested,crashedVersions){
  let result = false;
  let colors = ["blue","purple","green","gold"]
  channelsRequested.forEach(channel =>{
    let numVersion = versions[colors.indexOf(channel)]
    crashedVersions.forEach(version => {
      if(numVersion == version) {
        result = true;
        return;
      }
    })
  })
  return result;
}

spaceSchema.statics.sendReportToWinSubscribers = function (winReport,bot){
  return new Promise((resolve,reject)=>{
    console.log("about to parse and send a message to found users");
    let clients= "";
    winReport.client_version.forEach(item =>{
      clients += item + ", ";
    })
    var stringToSearch =winReport.hashA + winReport.method;
    let lastReported= winReport.client_version.slice(-1).pop();
    let isRegression = false;
    let regressionText= "";
    if(typeof(winReport.is_resolved) !=='undefined' && lastReported > winReport.is_resolved ) {
      console.log("possible regression detected");
      isRegression = true;
      regressionText = "\n\n- **Possible issue regressed!**";
    }
    var failureReport = "Win crash received: " +
                      //"\nevent: " + req.body.event +
                      //"\npayload Type: " + req.body.payload_type +
                      "\n\n- **Crash Id:** " + winReport.id +
                      "\n\n- **First Report:** " + winReport.reportDate[0] +
                      "\n\n- **Last Report:** " + winReport.reportDate.slice(-1).pop() +
                      "\n\n- **Title:** " + winReport.title +
                      "\n\n- **Crash Hash:** " + winReport.hashA +
                      "\n\n- **Hash C:** " + winReport.hashC +
                      "\n\n- **method affected:** " + winReport.method +
                      "\n\n- **Feedback ID:** " + winReport.feedback_id  +
                      "\n\n- **Crashes Count:** " + winReport.crashes_count +
                      "\n\n- **Resolved Version:** " + winReport.is_resolved +
                      "\n\n- **Team Assigned:** " + winReport.assigned_team +
                      "\n\n- **Client Version:** " + clients +
                      regressionText +
                      //"\nimpacted_devices_count: " + req.body.payload.impacted_devices_count +
                      "\n\n- **url to the crash:** " + "[PRT server URL]" + "("+ winReport.url + ")";

    stringToSearch = stringToSearch.toLowerCase();
    this.list(function(err,users){
      if(err){
        console.log("error reading the database");
        reject(err)
      }
      else if (users){
        var roomsIds = [];
        var roomsIdSet = new Set();
        users.forEach(function(item){
            var tags = item.macReports.tags;
            if (tags[1] === "everything" && (typeof(winReport.is_resolved) ==='undefined' || isRegression)){
              roomsIdSet.add(item.roomId);
            } else if(isChannelRequestedFound(item.channels, winReport.client_version)) {
              roomsIdSet.add(item.roomId);
            } else {
              tags.forEach(function(tag){
                  var position = stringToSearch.indexOf(tag);
                  if(position >= 0 && (typeof(winReport.is_resolved) ==='undefined' || isRegression)){
                    console.log("USER FOUND SAVING THE ROOM ID INTO AN ARRAY");
                    roomsIdSet.add(item.roomId);
                  }
              })
            }
          })
          for(var roomId of roomsIdSet.values()){
           console.log("nuber of users found:" + roomsIdSet.size);
           bot.sendRichTextMessage(roomId,failureReport,function(){
              console.log("user found about to send him a message");
           })
          }
        }
      });
  })
}

spaceSchema.statics.isSpaceRegistered = function(room_id) {
  return new Promise((resolve,reject) =>{
    this.find({roomId:room_id}, function(err, result){
      if (err) {
        console.log('error retreiving from the database');
        resolve(false)
      } else if (result.length > 0){
        console.log('user found in the databasae ');
        resolve(true);
      } else {
        // if the scope is different than null it means we are registering a space
        console.log('user not found in the databasae ');
        resolve(false);
      }
    });
  });
}

spaceSchema.statics.deleteUserPromified = function (room_id) {
  return new Promise((resolve,reject) =>{
    this.find({roomId: room_id}).remove().exec(function(err, data){
      if(err) {
        "Error deleting the user, please try again later";
        resolve("Error deleting the user, please try again later")
      }
      else if(data.result.n === 0) {
        resolve("Space not registered in the database");
      }
      else {
        resolve("Room deleted from the database");
      }
    });
  })
}

spaceSchema.statics.showUserOptionsPromified = function (room_Id) {
  return new Promise((resolve,reject) =>{
    this.find({roomId: room_Id}, function(err, result) {
      if (result.length>0){
        if(result[0].roomType === "group"){
          let reply = "These are currently the registration options for this group space " + result[0].nickName + ":" +
                                  "\n\n- Receive Spark client crash reports real time: " + "**"+ result[0].macReports.receive + "**"+
                                  "\n\n- Crash Reports filter keywords: " + "_"+ result[0].macReports.tags + "_"+
                                  "\n\n- You can use this room to display Splunk Alerts:" + "**"+ result[0].splunkReports.receive+ "**";
          resolve(reply);
        }
        else{
          let reply= "These are currently your registration options " + result[0].nickName + ":" +
                                  "\n\n- Name: " + "**" +result[0].personName+ "**" +
                                  "\n\n- Receive Spark client crash reports real time: " + "**"+ result[0].macReports.receive + "**"+
                                  "\n\n- Crash Reports filter keywords: " + "_"+ result[0].macReports.tags + "_"+
                                  "\n\n- You can use this room to display Splunk Alerts:" + "**"+ result[0].splunkReports.receive+ "**";
          resolve(reply);
        }

      }
      else {
        resolve("You are not yet registered");
    }
  });
  })
}
spaceSchema.statics.addFilterKeyWord = function (room_Id,keyword) {
  return new Promise((resolve,reject) =>{
    let keywordArray = keyword.split(',');
    this.findOneAndUpdate({roomId: room_Id},{$pushAll: {"macReports.tags": keywordArray, "windowsReports.tags":keywordArray}},
      {safe: true, upsert: true}, function(err, result) {
        if(err) {
          let reply = "Failed to ad the keyword with following error: " + err;
          resolve(reply)
        } else {
          let reply = "Keyword(s) **" + keyword + "** added to the crash filter";
          resolve(reply)
        }

  });
  })
}

spaceSchema.statics.addChannelFilter = function (room_Id, channel) {
  return new Promise((resolve,reject) =>{
    let channelArray = channel.split(',');
    this.findOneAndUpdate({roomId: room_Id}, function(err, result) {
        if(err) {
          let reply = "Failed to ad the keyword with following error: " + err;
          resolve(reply)
        } else {
          result.channels = channelArray;
          result.save(function(err){
            console.log("error saving the channel")
          })
          let reply = "Channels **" + channelArray + "** added to the system";

          resolve(reply)
        }

  });
  })
}

spaceSchema.statics.addFilterKeyWordDistinct = function (room_Id,keyword) {
  return new Promise((resolve,reject) =>{
    let keywordArray = keyword.split(',');
    this.findOne({roomId: room_Id}, function(err, result) {
        if(err) {
          let reply = "Failed to ad the keyword with following error: " + err;
          resolve(reply)
        } else {
          let reply = "Keyword(s) **" + keyword + "** added to the crash filter"
          let found = false;
          keywordArray.forEach(item=>{
            result.macReports.tags.forEach(item2=>{
              if(item2 === item) {
                console.log("keyword already present in the filter")
                found = true;
              }
            })
            if(found === false) {
              result.macReports.tags.push(item);
            } else {
              found = false;
            }
          })
          result.windowsReports.tags = result.macReports.tags;
          result.save(err=>{
            console.log("error saving the space");
          })
          resolve(reply)
        }

      });
  })
}
spaceSchema.statics.showFilterWords = function (room_Id) {
  return new Promise((resolve,reject) =>{
    this.find({roomId: room_Id}, function(err, result) {
      if (result.length>0){
        resolve(result[0].macReports.tags.toString());

      }
      else {
        resolve("You are not yet registered");
    }
  });
  })
}

spaceSchema.statics.deleteAllFilterWord = function(room_Id) {
  return new Promise((resolve,reject) =>{
    this.findOneAndUpdate({roomId: room_Id},{$set: {"macReports.tags": [], "winreports.tags":[]}},
      {safe: true}, function(err, result) {
        if(err) {
          let reply = "Failed to empty the filter with following error: " + err;
          reject(reply)
        } else {
          let reply = "filter is now empty, this room won't receive any crash report";
          resolve(reply)
        }
   })
  })
}
spaceSchema.statics.enableSplunk = function(room_Id) {
  return new Promise((resolve,reject) =>{
    this.findOneAndUpdate({roomId: room_Id},{$set: {"splunkReports.receive":"yes" }},
      {safe: true}, function(err, result) {
        if(err) {
          let reply = "Failed to enable splunk on the space: " + err;
          reject(reply)
        } else {
          let reply = "Splunk is enabled to this space, so now can receive splunk alerts";
          resolve(reply)
        }
   })
  })
}
spaceSchema.statics.disableSplunk = function(room_Id) {
  return new Promise((resolve,reject) =>{
    this.findOneAndUpdate({roomId: room_Id},{$set: {"splunkReports.receive":"no" }},
      {safe: true}, function(err, result) {
        if(err) {
          let reply = "Failed to disable splunk on the space: " + err;
          reject(reply)
        } else {
          let reply = "Splunk is disabled on this space, splunk alerts can't be sent to this space";
          resolve(reply)
        }
   })
  })
}

spaceSchema.statics.registerSpace = function(space){
  return new Promise((resolve,reject) =>{
    space.save(function(err){
      if(err) {
        resolve(false)
      } else {
        console.log("user saved to the database")
        resolve(true)
      }
    })
  })
}

spaceSchema.pre('remove', function (next) {
  return new Promise((resolve,reject) =>{
    this.update(
      { "macReports.tags": this, "winreports.tags": this },
      { $pull: { "macReports.tags": this._id, "winreports.tags": this_id } },
      { multi: true }, function(err, result) {
        if(err) {
          reject(err)
        } else {
          resolve(result)
        }
     });
  })
})

spaceSchema.statics.deleteFilterWord = function (room_Id,keyword) {
  return new Promise((resolve,reject) =>{
    let keywordArray = keyword.split(',');
    this.findOne({roomId: room_Id},{$pull: {"macReports.tags": keywordArray, "winreports.tags":keywordArray}},
      {safe: true}, function(err, result) {
        if(err) {
          let reply = "Failed to remove the keyword with following error: " + err;
          resolve(reply)
        } else {
          let reply = "Keyword **" + keyword + "** removed to the crash filter";
          resolve(reply)
        }

  });
  })
}



spaceSchema.statics.deleteFilterWord = function (room_Id,keyword) {
  this.findOne(req.params.comment_id)
    .then(function (comment) {
      return comment.remove() // doc.remove will trigger the remove middleware
    })
    .then(function () {
      console.log('Comment successfully deleted!')
      return res.redirect('back')
    })
    .catch(function (err) {
      console.log(err)
      res.redirect('/index')
    })
}






// module.exports = mongoose.model('SparkSpace', spaceSchema);
module.exports = spaceSchema;
