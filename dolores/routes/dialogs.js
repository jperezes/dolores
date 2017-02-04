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
console.log(' Already connected now to the database');
var spaceModel = conn.model('SparkSpace', Space);
var dialogModel = conn.model('Dialog', Dialog);
var space = new spaceModel();


///
var confirmNameAndEmail = function(tempSpace){

  reply = "** ·Name:** " + tempSpace.person.displayName +
                          "\n** ·Email:** " + tempSpace.personEmail +
                          "\n** ·Is this data correct? answer <yes/no>";

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

  console.log("Question received" + question.message);

  if (typeof dbMessage === 'undefined' && scope ==="") {
    reply = "sorry, I didn't understand those";
    console.log('question NOT found: ');
  }
  else if ((typeof dbMessage != 'undefined' && dbMessage.id == '6') || scope == "menu")  {
    reply = "Done, what can I do for you " + question.person.nickName + "?"+ showMenu() + "\n<1><2><3>";
      scope = "chooseMenu"
  }
  else if (scope !="") {
    console.log("We are inside an interactive scope, switching to: " + scope);
    // User choosed between 1 Register, 2 - unregister 3 show options
    // Next question is ask if name and email is correct
    switch(scope) {
      // nextQuestion & space update
      var report = confirmNameAndEmail(question);
      case "chooseMenu":
      console.log("inside of choosing menu, so user has choosed an option first time");
        switch (question.message) {
          case "1":
            reply = report.reply();
            space = report.space();
            scope = "askForConfirmation";
          break;
          case "2":
           var deleteSpace = uninitScopeSchema(space);
           space = deleteSpace.space();
           scope = "";
           // TODO: hacer el metodo que borra usuario.
           reply = "Space unregistered, Goodbye!"
          break;
          case "3":
          //TODO: crear el metodo que busca el usuario en la base de datos
          break;
          default:
            var deleteSpace = uninitScopeSchema(space);
            space = deleteSpace.space();
            scope = "";
            reply = "Goodbye" + question.person.nickName + "!";
          break;
        }
      break;
      case "askForConfirmation":
        //User confirmed name and email. Next question Mac report option.
        if (question.message === 'yes') {
          var updateSpace = updateTempSpace(question);
          space = updateSpace.space();
          reply = "Do you want me to send you Mac reports as they happen?";
          scope = "askForMacReportOption";
        }
        else {
          var uninitSchema = uninitScopeSchema(space);
          space = uninitSchema.space();
          reply = "Goodbye " + question.person.nickName + ", if you want to proceed just start again.";
          scope = "";
        }
      break;
      case "askForMacReportOption":
        // User confirmed mail/name and replied mac option. Next question is options
        if(question.message === 'yes') {
          space.macReports.receive = "yes";
          reply = "please write the tags you want to filter the mac reports " +
                  "to receive separated by comma (i.e: whiteboard, auxiliaryDeviceService.cpp,whiteboardView.swift):";
          scope = "populateMacTagsScope";
        }
        else {
          space.macReports.receive = "no";
          reply = "No Spark for Mac crash reports will be sent to you " + question.person.nickName +
          " do you want me to send you Windows reports (don't worry they are filtered also :) )";
          scope = "confirmWindowsOptions";
        }
      break;
      case "populateMacTagsScope":
        // User said it wants to get mac reports populating options. Next question for windows option.
        space.macReports.tags =[question.message];
        reply = "Do you want me to send you Spark for Windows crash reports ?";
        scope = "confirmWindowsOptions";
      break;
      case "confirmWindowsOptions":
        // User replied whether to receive windows options.
        if(question.message === 'yes') {
          reply = "please write the tags you want to filter the Windows reports " +
                  "to receive separated by comma (i.e: whiteboard, auxiliaryDeviceService.cpp,whiteboardView.swift):";
          space.windowsReports.receive = "yes";
          scope = "winOptionConfirmation";
        }
        else {
          space.windowsReports.receive = "no";
          reply = "No Windows for Mac crash reports will be sent to you " + question.person.nickName +
          "Do you want me to send you Splunk reports?";
          scope = "confirmSplunkOptions";
        }
      break;
      case "winOptionConfirmation":
        // User confirmed windows options and populated tags. next question for splunk Alerts
        space.windowsReports.tags =[question.message];
        reply = "Do you want me to send you Splunk reports?";
        scope = "confirmSplunkOptions";
      break;
      case "confirmSplunkOptions":
        // user replied to teh Splunk Option. Next is to show the final confirmation.
        if (question.message = 'yes'){
          space.splunkReports.receive = "yes";
        }
        else {
          space.splunkReports.receive = "no";
        }
        var showSpace = showCurrentOptions(space);
        reply = "is the following data correct??\n" + showSpace.reply();
        scope = "registrationConfirmed";
      break;
      case "registrationConfirmed":
        if (question.message === yes) {
          saveUserToDB(space);
        }
        else {
          reply = "Sorry if something was wrong, please try again later";
        }
        scope = "";
        var uninitSchema = uninitScopeSchema(space);
        space = uninitSchema.space();
      break;
      default:
        reply = "Did not understand that, try again later" + question.person.nickName;
        scope = "";
      break;
    }
  }
  else if (typeof dbMessage != 'undefined') {
      console.log("valid question, searching for reply: ");
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
