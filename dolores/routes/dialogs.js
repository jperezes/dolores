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
var populateTempSpace = function(tempSpace){
  if (tempSpace.roomType === "group") {
    reply = "** ·Your name:** " + tempSpace.person.displayName +
                            "\n** ·Room is not one to one:** " +
                            "\n** ·Is this data correct? answer <yes/no>";
  } else {
    reply = "** ·Name:** " + tempSpace.person.displayName +
                            "\n** ·Email:** " + tempSpace.personEmail +
                            "\n** ·Is this data correct? answer <yes/no>";
    space.personName = tempSpace.person.displayName;
    space.nickName = tempSpace.person.nickName;
  }
  space.personEmail = tempSpace.personEmail;
  space.roomId = tempSpace.roomId;
  space.roomType = tempSpace.roomType;
  //Use the module pattern
  return {
    space: function() {
      return space;
    },
    reply: function() {
      return reply;
    }
  }
  console.log('[populateTempSpace:] about to go to confirmation if no error ' + space.personName + reply);
}

var showCurrentOptions = function(space) {
  var userData = "";
  if(space.roomType === "direct") {
    userData = "** ·Name:** " + space.personName +
                            "\n** ·Email:** " + space.personEmail;

  }
  reply = userData + "\n** ·Receive Spark Mac Reports?** " + space.macReports.receive +
                          "\n** ·Mac Reports filter tags:** " + space.macReports.tags +
                          "\n** ·Receive Spark Windows Reports?** " + space.windowsReports.receive +
                          "\n** ·Windows Reports filter tags:** " + space.windowsReports.tags +
                          "\n** ·Receive Splunk Alerts? **" + space.splunkReports.receive +
                          "\n** Is this data correct? answer <yes/no>**";

  return {
      reply: function() {
            return reply;
      }
  }
};

// returns the entire object inside the arry, need the .id to specify the Id
callbackQuery = function(question, dbMessage, bot) {


  if (typeof dbMessage === 'undefined' && scope ==="") {
    reply = "sorry, I didn't understand that";
    console.log('question NOT found: ');
  }
  else if ((typeof dbMessage != 'undefined' && dbMessage.id == '6') || scope == "menu")  {
    reply = "Done, what can I do for you " + question.person.nickName + "?"+ showMenu();
      scope = "chooseMenu"
  }
  else if (scope !="") {
    // User choosed between 1 Register, 2 - unregister 3 show options
    // Next question is ask if name and email is correct
    var cleanQuestion = question.message.toLowerCase().replace(" dolores","").replace("dolores ","").replace("?","");
    switch(scope) {
      // nextQuestion & space update

      case "chooseMenu":
      console.log("inside of choosing menu, so user has choosed an option first time")
        switch (cleanQuestion) {
          case "1":
            var report = populateTempSpace(question);
            reply = report.reply();
            space = report.space();
            scope = "askForConfirmation";
          break;
          case "2":
           space.unInitSelf();
           scope = "";
           reply = "About to delete the user from the database"; // cleaning the reply this is a final state.
           // TODO: hacer el metodo que borra usuario.
           spaceModel.deleteUser(question,bot, this.callbackQuery);
           return;
          break;
          case "3":
          //TODO: crear el metodo que busca el usuario en la base de datos
            scope="";
            space = populateTempSpace(question).space();
            spaceModel.showUserOptions(space, bot, this.callbackQuery);
            return;
          break;
          default:
            space.unInitSelf();
            scope = "";
            reply = "Goodbye" + question.person.nickName + "!";
          break;
        }
      break;
      case "askForConfirmation":
        //User confirmed name and email. Next question Mac report option.
        if (cleanQuestion === 'yes') {
          space.updateTempSpace(question);
          reply = "Do you want me to send you Mac reports as they happen? <yes/no>";
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
        if(cleanQuestion === 'yes') {
          space.macReports.receive = "yes";
          reply = "Please write the tags you want to filter the mac reports " +
                  "to receive separated by comma. (i.e: whiteboard, auxiliaryDeviceService.cpp,whiteboardView.swift):";
          scope = "populateMacTagsScope";
        }
        else {
          space.macReports.receive = "no";
          reply = "No Spark for Mac crash reports will be sent to you " + question.person.nickName +
          "\nDo you want me to send you Windows reports? <yes/no>";
          scope = "confirmWindowsOptions";
        }
      break;
      case "populateMacTagsScope":
        // User said it wants to get mac reports populating options. Next question for windows option.
        var array = cleanQuestion.split(',');
        for (var i in array) {
          space.macReports.tags[i] =array[i];
        }
        reply = "Do you want me to send you Spark for Windows crash reports? <yes/no>";
        scope = "confirmWindowsOptions";
      break;
      case "confirmWindowsOptions":
        // User replied whether to receive windows options.
        if(cleanQuestion === 'yes') {
          reply = "Please write the tags you want to filter the Windows reports " +
                  "to receive separated by comma. (i.e: whiteboard, auxiliaryDeviceService.cpp,whiteboardView.swift):";
          space.windowsReports.receive = "yes";
          scope = "winOptionConfirmation";
        }
        else {
          space.windowsReports.receive = "no";
          reply = "No Spark for Windows crash reports will be sent to you " + question.person.nickName +
          "\nDo you want me to send you Splunk reports? <yes/no>";
          scope = "confirmSplunkOptions";
        }

      break;
      case "winOptionConfirmation":
        // User confirmed windows options and populated tags. next question for splunk Alerts
        space.windowsReports.tags =[question.message];
        reply = "Do you want me to send you Splunk reports? <yes/no>";
        scope = "confirmSplunkOptions";
      break;
      case "confirmSplunkOptions":
        // user replied to teh Splunk Option. Next is to show the final confirmation.
        if (cleanQuestion === 'yes'){
          space.splunkReports.receive = "yes";
        }
        else {
          space.splunkReports.receive = "no";
        }
        var showSpace = showCurrentOptions(space);
        reply = "Is the following data correct?\n" + showSpace.reply();
        scope = "registrationConfirmed";
      break;
      case "registrationConfirmed":
        scope = "";
        if (cleanQuestion === 'yes') {
          spaceModel.insertUser(space, bot, this.callbackQuery);
          return;
        }
        else {
          reply = "Sorry if something was wrong, please try again later";
        }

        //space = uninitScopeSchema(space).space();
      break;
      default:
        reply = "Did not understand that, try again later" + question.person.nickName;
        scope = "";
      break;
    }
  }
  else if (typeof dbMessage != 'undefined') {
      reply = dbMessage.response;
  }
  else {
    console.log('An error ocurred');
  }

  if (mongoUrl ==='mongodb://localhost:27017/spaces'){
    var err = null;
    bot(err,reply);
  }else {
    bot.sendMessage(question.roomId, reply , function(){
    console.log('Message sent from Bot!');
    });
  }

  console.log("At the end of the else if block from DB this is the result:\n" + reply);
}

var showMenu = function(){
    return "\n1: Register Space" + "\n2: Unregister Space" + "\n3: Show Space options" + "\n<1><2><3>";
}
dialogModule.prototype.showMenu = function(){
  return showMenu();
}

dialogModule.prototype.showCurrentOptions = function(){
  var showOptions = showCurrentOptions(space);
  return showOptions.reply();
}

dialogModule.prototype.showSchema = function(){
  return space;
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
