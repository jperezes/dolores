let Space = require('../models/space');
let Dialog = require('../models/conversations')
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';


let scope = "";
let reply = "";
let dialogModule = function(){};

console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
let conn = mongoose.createConnection(mongoUrl);

let spaceModel = conn.model('SparkSpace', Space);
let dialogModel = conn.model('Dialog', Dialog);
let space = new spaceModel();

///
let populateTempSpace = function(tempSpace){
  if (tempSpace.roomType === "group") {
    reply = "** ·Your name: " + tempSpace.person.displayName +
                            "\n** ·Room is not one to one: " +
                            "\n** ·Is this data correct? answer <yes/no>";
  } else {
    reply = "** ·Name: " + tempSpace.person.displayName +
                            "\n** ·Email: " + tempSpace.personEmail +
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
    userData = "\n\n* Name: " + "**"+ space.personName +"**";
  }
  reply = userData + "\n\n*Receive Spark client crash reports real time: " + "**"+ space.macReports.receive +"**"+
                     "\n\n*Crash Reports filter keywords: " + "**"+ space.macReports.tags + "**"+
                     "\n\n*You can use this room to display Splunk Alerts (default option)";

  return {
      reply: function() {
            return reply;
      }
  }
};

// returns the entire object inside the arry, need the .id to specify the Id
callbackQuery = function(question, dbMessage, bot) {


  if (typeof dbMessage === 'undefined' && scope ==="") {
    //reply = "sorry, I didn't understand that";
    console.log('question NOT found: ');
    return
  }
  else if ((typeof dbMessage != 'undefined' && dbMessage.id == '6') || scope == "menu")  {
    reply = "What can I do for you " + question.person.nickName + "?"+ showMenu();
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
            //reply = report.reply();
            space = report.space();
            space.updateTempSpace(question);
            reply = "Please write the tags you want to filter the crash reports separated by comma " +
                    "for example: *whiteboard*, _auxiliaryDeviceService_,*roomsView*, so I will sent you only the ones you are interested at." +
                    "\n\nIf you want to receive all the crashes reported type \"**everything**\"." +
                    "\n\nIf you don't want to receive any reporte type \"**none**\"." +
                    "\n\nYou can update these options at any time by typing \"**Bring yourself back online**\".";
            scope = "populateMacTagsScope";
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
          // var uninitSchema = uninitScopeSchema(space);
          // space = uninitSchema.space();
          reply = "Goodbye " + question.person.nickName + ", if you want to proceed just start again.";
          scope = "";
        }
      break;
      case "askForMacReportOption":
        // User confirmed mail/name and replied mac option. Next question is options
        if(cleanQuestion === 'yes') {
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
        space.macReports.receive = "yes";
        space.windowsReports.receive="yes";
        space.splunkReports.receive = "yes";
        // User said it wants to get mac reports populating options. Next question for windows option.
        var array = cleanQuestion.split(',');
        if (array[0].toLowerCase() === "none") {
          space.macReports.receive = "no";
          space.windowsReports.receive="no";
        }
        for (var i in array) {
          space.macReports.tags[i] =array[i];
          space.windowsReports.tags[i] =array[i];
        }
        var showSpace = showCurrentOptions(space);
        reply = "This room will be registered with the following options " + space.nickName +":\n" + showSpace.reply() + "\n\nAre they correct?<yes/no>";
        scope = "registrationConfirmed";
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
        reply = "This room will be registered with the following options " + space.nickName +":\n" + showSpace.reply() + +"\n\nAre they correct?<yes/no>";
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
    bot.sendRichTextMessage(question.roomId, reply , function(){
    console.log('Message sent from Bot!');
    });
  }

  console.log("At the end of the else if block from DB this is the result:\n" + reply);
}

var showMenu = function(){
    return "\n\n1. Register Space \n\n2. Unregister Space" + "\n\n3. Show Space options" + "\n\n\n Select <1><2><3>";
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
let isSpaceRegistered = space => {
  return new Promise((resolve,reject) =>{
    spaceModel.find({roomId:space.roomId}, function(err, space){
      if (err) {
        console.log('error retreiving from the database');
        userRegistered = false;
      } else if (space.length > 0){
        console.log('user found in the databasae ');
        resolve(true);
      } else {
        // if the scope is different than null it means we are registering a space
        resolve(scope !== "");
      }
    }).limit(1);
  });
}

dialogModule.prototype.parseQuestion = function(query, bot){
  //dialogModel.retrieveResponse(query, bot, callbackQuery);
  //this promise returns the result and it passes it to the function to process it, then name is still callbackQuery.
  //dialogModel.retrieveResponsePromised(query).then(data => callbackQuery(query,data,bot));
  isSpaceRegistered(query).then(result => {
    if(result) return dialogModel.retrieveResponsePromised(query);
    else{
      data ={
        id:"6",
        response:"Done",
        question:"bring yourself back online"
      };
      return Promise.resolve(data);
    }
  }).then(data => callbackQuery(query,data,bot)).catch("error");
}


dialogModule.prototype.getUser = (user) =>{
    let userRegistered;
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
