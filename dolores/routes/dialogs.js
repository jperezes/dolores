var Space = require('../models/space');
var Dialog = require('../models/conversations')
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';


var scope = "";
var reply = "";
var dialogModule = function(){};

console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
var conn = mongoose.createConnection(mongoUrl);

var spaceModel = conn.model('SparkSpace', Space);
var dialogModel = conn.model('Dialog', Dialog);
var space = new spaceModel();

///
var macReportConfirmation = function(tempSpace){

  reply = "** ·Name:** " + tempSpace.person.displayName +
                          "\n** ·Email:** " + tempSpace.personEmail +
                          "\n** ·Do you want to receive crash mac Reports? answer <yes/no>";
  space.roomId = tempSpace.roomId;
  space.roomType = tempSpace.roomType;
  space.personName = tempSpace.person.displayName;
  space.personEmail = tempSpace.personEmail;
  space.nickName = tempSpace.person.nickName;
  //Use the module pattern
  return {
    space: function() {
      return space;
    },
    reply: function() {
      return reply;
    }
  }
  console.log('[macReportConfirmation:] about to go to confirmation if no error ' + space.personName + reply);
};

var showCurrentOptions = function(space) {
  reply = "** ·Name:** " + space.personName +
                          "\n** ·Email:** " + space.personEmail +
                          "\n** ·Receive Spark Mac Reports?** " + space.macReports.receive +
                          "\n** ·Mac Reports filter tags:** " + space.macReports.tags +
                          "\n** ·Receive Spark Windows Reports?** " + space.macReports.receive +
                          "\n** ·Windows Reports filter tags:** " + space.windowsReports.tags +
                          "\n** ·Receive Splunk Alerts? **" + space.splunkReports.receive +
                          "\n** Is this data correct? answer <yes/no>**";
  return {
      reply: function() {
            return reply;
      }
  }
};

var uninitScopeSchema = function(space){
  space.roomId = "";
  space.roomType = "";
  space.personName = "";
  space.personEmail = "";
  space.nickName = "";
  space.macReports.receive = "";
  space.windowsReports.tags = [];
  space.macReports.receive = [];
  space.splunkReports.receive = "";
  //Use the module pattern
  return {
    space: function() {
      return space;
    }
  }
};

var saveUserToDB = function(space){
  space.save(function(err) {
    if (err) {
      console.log('Error saving the message');
      reply = "There was an error saving your details, please try again later";
    } else {
      reply = "Welcome to Westworld " + space.nickName + "!";
    }
  });
};

var updateTempSpace = function(tempSpace){

    space.roomId = tempSpace.roomId;
    space.roomType = tempSpace.roomType;
    space.personId = tempSpace.personId;
    space.personName = tempSpace.personName;
    space.personEmail = tempSpace.personEmail;
    space.nickName = tempSpace.nickName;
    return {
      space: function() {
        return space;
      }
    }
};
///


// returns the entire object inside the arry, need the .id to specify the Id
callbackQuery = function(question, dbMessage, bot) {


  if (typeof dbMessage === 'undefined' && scope ==="") {
    reply = "sorry, I didn't understand those";
    console.log('question NOT found: ');
  }
  else if ((typeof dbMessage != 'undefined' && dbMessage.id == '6') || scope == "menu")  {
    reply = "Done, what can I do for you " + question.person.nickName + "?"+ showMenu() + "\n<1><2><3>";
      scope = "chooseMenu"
  }
    var report = macReportConfirmation(question);
  else if (typeof dbMessage != 'undefined') {
      reply = dbMessage.response;
  }
  else {
    console.log('An error ocurred');
  }
  bot.sendMessage(question.roomId, reply , function(){
  console.log('Message sent from Bot!');
  });
  console.log("At the end of the else if block from DB this is the result:\n" + reply);
}


function showMenu(){
  return "\n1: Register Space" + "\n2: Unregister Space" + "\n3: Show Space options";
}

dialogModule.prototype.parseQuestion = function(query, bot){
  dialogModel.retrieveResponse(query, bot, callbackQuery);
}


dialogModule.prototype.getUser = function(user) {
    var userRegistered;
    console.log('attempting to find the user ' + user.personEmail+ ' in the DB');
    spaceModel.find({personEmail:user.personEmail}, function(err, space){
      if (err) {
        console.log('error retreiving from the database');
        userRegistered = false;
      } else if (space.length > 0){
        console.log('user found in the databasae ');
        userRegistered=true;
      } else {
        console.log('user not registered');
        userRegistered=false;
      }
    }).limit(1);
    return userRegistered;
}



module.exports = dialogModule;
