let Space = require('../models/space');
let Dialog = require('../models/conversations')
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let Promise= require('bluebird')
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
    userData = "\n\n- Name: " + "**"+ space.personName +"**";
  }
  reply = userData + "\n\n- Receive Spark client crash reports real time: " + "**"+ space.macReports.receive +"**"+
                     "\n\n- Crash Reports filter keywords: " + "**"+ space.macReports.tags + "**"+
                     "\n\n- You can use this room to display Splunk Alerts:" + "**" + space.splunkReports.receive + "**";

  return {
      reply: function() {
            return reply;
      }
  }
};

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

dialogModule.prototype.parseQuestion = Promise.coroutine(function* (query, bot){

  let cleanQuestion = query.message.toLowerCase().replace(" dolores","").replace("dolores ","").replace("?","");
  let reply ="";
  let alreadyRegistered = yield spaceModel.isSpaceRegistered(query.roomId);
  if (alreadyRegistered && cleanQuestion !== "bring yourself back online") {
    console.log("user already registered proceeding to find the question")
    reply = yield dialogModel.retrieveResponsePromised(query);
    bot.sendRichTextMessage(query.roomId, reply , function(){
    console.log('Message sent from Bot!');
    })
  } else if(cleanQuestion === "bring yourself back online" || (!alreadyRegistered && scope ==="")) {
    console.log("newUser add asking for menu");
    reply = "What can I do for you " + query.person.nickName + "?"+ showMenu();
    scope = "menuShown"
  } else if (scope !=="") {
      switch(scope) {
        case "menuShown":
          if(cleanQuestion == "1"){
            var report = populateTempSpace(query);
            //reply = report.reply();
            space = report.space();
            space.updateTempSpace(query);
            reply = "Please write the tags you want to filter the crash reports separated by comma " +
                    "for example: *whiteboard*, _auxiliaryDeviceService_,*roomsView*, so I will sent you only the ones you are interested at." +
                    "\n\n- If you want to receive all the crashes reported type \"**everything**\"." +
                    "\n\n- If you don't want to receive any reporte type \"**none**\"." +
                    "\n\n- You can update these options at any time by typing \"**Bring yourself back online**\".";
            scope = "tagsAsked";
          }else if(cleanQuestion == "2"){
            scope="";
            reply = yield spaceModel.deleteUserPromified(query.roomId);
          }else if(cleanQuestion == "3"){
            scope="";
            reply = yield spaceModel.showUserOptionsPromified(query.roomId);
          }else{
            scope="";
            reply = "incorrect answer";
          }
        break;
        case "tagsAsked":
          space.macReports.receive = "yes";
          space.windowsReports.receive="yes";
          // User said it wants to get mac reports populating options. Next question for windows option.
          cleanQuestion = cleanQuestion.replace(" ",""); //remove spaces
          var array = cleanQuestion.split(',');
          if (array[0].toLowerCase() === "none") {
            space.macReports.receive = "no";
            space.windowsReports.receive="no";
          }
          for (var i in array) {
            space.macReports.tags[i] =array[i];
            space.windowsReports.tags[i] = space.macReports.tags[i];
          }
          reply = "Would you like to enable this space to receive your splunk alerts?<yes/no>";
          scope = "splunkAsked";
        break;
        case "splunkAsked":
          // user replied to teh Splunk Option. Next is to show the final confirmation.
          if (cleanQuestion === 'yes'){
            space.splunkReports.receive = "yes";
          }
          else {
            space.splunkReports.receive = "no";
          }
          var showSpace = showCurrentOptions(space);
          reply = "This room will be registered with the following options " + space.nickName +":\n" + showSpace.reply() + "\n\nAre they correct?<yes/no>";
          scope = "askedForConfirmation";
        break;
        case "askedForConfirmation":
          scope = "";
          if (cleanQuestion === 'yes') {
            space.save(err =>{
              if (err) {
                this.reply = "error saving to the database, try again later"
              } else {
                console.log("spaced saved to database")
                this.reply = "Welcome to SparkWorld";
              }
            });
          }
          else {
            reply = "Sorry if something was wrong, please try again later";
          }
        break;
      }
  }
  if (mongoUrl ==='mongodb://localhost:27017/spaces'){
      var err = null;
      bot(err,reply);
  }else {
      bot.sendRichTextMessage(query.roomId, reply , function(){
                              console.log('Message sent from Bot!');
                              });
  }
})


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
