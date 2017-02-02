var Space = require('../models/space');
var Dialog = require('../models/conversations')
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';


var scope = "";
var dialogModule = function(){};

console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
var conn = mongoose.createConnection(mongoUrl);

var spaceModel = conn.model('SparkSpace', Space);
var dialogModel = conn.model('Dialog', Dialog);
var space = new spaceModel();
// returns the entire object inside the arry, need the .id to specify the Id
callbackQuery = function(question, dbMessage, bot) {
  var reply = "";

  if (typeof dbMessage === 'undefined' && scope ==="") {
    reply = "sorry, I didn't understand those";
    console.log('question NOT found: ');
  }
  else if ((typeof dbMessage != 'undefined' && dbMessage.id == '6') || scope == "menu")  {
    reply = "Done, what can I do for you " + question.person.nickName + "?"+ showMenu() + "\n<1><2><3>";
      scope = "chooseMenu"
  }
  else if (scope === "chooseMenu") {  // once here we have already parsed first message
    console.log('inside menu options about to be switched to the option!!!');
    switch (question.message) {
      case "1": //Register
        macReportConfirmation(question);
        reply = "is that ok? <yes/no>\n" ;//+ JSON.stringify(space)
        scope = "dataConfirmed";
        break;
      case "2": //cancel
        scope = "";
        reply = "Goodbye!";
        break;
      case "3": //Delete
        //deleteSpace();
        var reply = "User deleted, we'll miss ye";
        break;
    }
  }
  else if (scope === "dataConfirmed") {
    if (question.message === 'yes') {
      updateTempSpace(question);
      reply = "do you want me to send you Mac reports (don't worry they are filtered :) )";
      scope = "askForMacReportOption";
    }
    else {
      uninitScopeSchema();s
      reply = "Goodbye " + question.person.nickName + ", if you want to proceed just start again.";
      scope = "";
    }
  }
  else if (scope === "askForMacReportOption"){
    if(question.message === 'yes') {
      space.macReports.receive = "yes";
      reply = "please write the tags you want to filter the mac reports " +
              "to receive separated by comma (i.e: whiteboard, auxiliaryDeviceService.cpp,whiteboardView.swift):";
      scope = "populateMacTagsScope"
    }
    else {
      space.macReports.receive = "no";
      reply = "No Spark for Mac crash reports will be sent to you " + question.person.nickName;
      scope = "confirmWindowsOptions";
    }
  }
  else if (scope === "populateMacTagsScope"){
    space.macReports.tags =[question.message];
    scope = "confirmWindowsOptions";
  }
  else if (scope === "confirmWindowsOptions") {
    reply = "do you wantme to send you Windows reports (don't worry they are filtered also :) )";
    scope = "winOptionConfirmation"
  }
  else if (scope === "winOptionConfirmation") {
    if(question.message === 'yes') {
      space.windowsReports.receive = "yes";
      reply = "please write the tags you want to filter the mac reports " +
              "to receive separated by comma (i.e: whiteboard, auxiliaryDeviceService.cpp,whiteboardView.swift):";
      scope = "populateWinTagsScope"
    }
    else {
      space.windowsReports.receive = "no";
      reply = "No Spark for Windows crash reports will be sent to you " + question.person.nickName;
      scope = "confirmSplunkOptions";
    }
  }
  else if (scope === "populateWinTagsScope") {
    space.windowsReports.tags =[question.message];
    scope = "confirmSplunkOptions";
  }
  else if (scope === "confirmSplunkOptions") {
    reply = "do you want me to collect and send you your splunk alerts?";
    scope = "waitForSplunkConfirmation";
  }
  else if (scope === "waitForSplunkConfirmation"){
    if(question.message === yes) {
      space.splunkReports.receive = "yes";
    }
    else {
      space.splunkReports.receive = "no";
    }
    scope = "askForConfirmationScope";
  }
  else if (scope = "askForConfirmationScope") {
    showCurrentOptions();
    scope = "registrationConfirmed"
  }
  else if (scope === "registrationConfirmed") {
    if (question.message === yes) {
      saveUserToDB();
    }
    else {
      reply = "sorry if something was wrong, try again please";
    }
    scope = "";
    uninitScopeSchema();
  }
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
  return "\n1: Register" + "\n2: cancel" + "\n3: Delete User";
}

dialogModule.prototype.parseQuestion = function(query, bot){
  dialogModel.retrieveResponse(query, bot, callbackQuery);
}

function macReportConfirmation(tempSpace){

  var firstConfirmation = "** ·Name:** " + tempSpace.person.displayName +
                          "\n** ·Email:** " + tempSpace.person.personEmail +
                          "\n** ·Do you want to receive crash mac Reports? answer <yes/no>";


  space.roomId = tempSpace.roomId;
  space.roomType = tempSpace.roomType;
  space.personName = tempSpace.person.displayName;
  space.personEmail = tempSpace.personEmail;
  space.nickName = tempSpace.person.nickName;
}

function showCurrentOptions() {
  reply = "** ·Name:** " + space.personName +
                          "\n** ·Email:** " + space.personEmail +
                          "\n** ·Receive Spark Mac Reports?** " + space.macReports.receive +
                          "\n** ·Mac Reports filter tags:** " + space.macReports.tags +
                          "\n** ·Receive Spark Windows Reports?** " + space.macReports.receive +
                          "\n** ·Windows Reports filter tags:** " + space.windowsReports.tags +
                          "\n** ·Receive Splunk Alerts? **" + space.splunkReports.receive +
                          "\n** Is this data correct? answer <yes/no>**";
}

function uninitScopeSchema(){
  space.roomId = "";
  space.roomType = "";
  space.personName = "";
  space.personEmail = "";
  space.nickName = "";
  space.macReports.receive = "";
  space.windowsReports.tags = [];
  space.macReports.receive = [];
  space.splunkReports.receive = "";
}
function saveUserToDB(){
  space.save(function(err) {
    if (err) {
      console.log('Error saving the message');
      reply = "There was an error saving your details, please try again later";
    } else {
      reply = "Welcome to Westworld " + space.nickName + "!";
    }
  });
}

var updateTempSpace = function(tempSpace){

    space.roomId = tempSpace.roomId;
    space.roomType = tempSpace.roomType;
    space.personId = tempSpace.personId;
    space.personName = tempSpace.personName;
    space.personEmail = tempSpace.personEmail;
    space.nickName = tempSpace.nickName;
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
