let Space = require('../models/space');
let Dialog = require('../models/conversations')
let WinReportSchema = require('../models/winCrashModel')
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let Promise= require('bluebird')
let mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';
let mongoReportUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/spaces';


let scope = "";
let currentRegisteringUser = "";
let reply = "";
let dialogModule = function(){};
let tempSpace = {
    roomId: "",
    roomType: "",
    personName: "",
    personEmail: "",
    nickName: "",
    macReports: {
      receive: "" ,
      tags: [""]
    },
    splunkReports: {
      receive: ""
    },
    windowsReports: {
      receive: "",
      tags: [""]
    }
};

let cleanTempSpace = ()=>{
  tempSpace.roomId = "";
  tempSpace.roomType="";
  tempSpace.personName="";
  tempSpace.personEmail="";
  tempSpace.nickName="";
  tempSpace.macReports.tags=[""];
  tempSpace.macReports.receive="";
  tempSpace.windowsReports.tags=[""];
  tempSpace.windowsReports.receive="";
  tempSpace.splunkReports.receive="";
}

console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
let conn = mongoose.createConnection(mongoUrl);
let con = mongoose.createConnection(mongoReportUrl);

let spaceModel = conn.model('SparkSpace', Space);
let dialogModel = conn.model('Dialog', Dialog);
let winReportModel = con.model('winReport',WinReportSchema)


///
let populateTempSpace = function(space){
  if (space.roomType === "group") {
    reply = "** ·Your name: " + space.person.displayName +
                            "\n** ·Room is not one to one: " +
                            "\n** ·Is this data correct? answer <yes/no>";
  } else {
    reply = "** ·Name: " + space.person.displayName +
                            "\n** ·Email: " + space.personEmail +
                            "\n** ·Is this data correct? answer <yes/no>";
    tempSpace.personName = space.person.displayName;
    tempSpace.nickName = space.person.nickName;
  }
  tempSpace.personEmail = space.personEmail;
  tempSpace.roomId = space.roomId;
  tempSpace.roomType = space.roomType;
}

let copySpace = space => {
    space.roomId=tempSpace.roomId ;
    space.roomType = tempSpace.roomType;
    space.personName = tempSpace.personName;
    space.personEmail = tempSpace.personEmail;
    space.nickName = tempSpace.nickName;
    space.macReports.tags = tempSpace.macReports.tags;
    space.macReports.receive = tempSpace.macReports.receive;
    space.windowsReports.tags = tempSpace.windowsReports.tags;
    space.windowsReports.receive = tempSpace.windowsReports.receive;
    space.splunkReports.receive = tempSpace.splunkReports.receive;
    //Use the module pattern
    return {
      space: function() {
          return space;
      }
    }
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
let lockRegistration= roomId=>{
  currentRegisteringUser = roomId;
}
let unlockRegistration = () =>{
  currentRegisteringUser = "";
  scope = "";
}

dialogModule.prototype.parseQuestion = Promise.coroutine(function* (query, bot){
  let space = new spaceModel();
   console.log("THE SCOPE IS: " + scope);
  let cleanQuestion = query.message.toLowerCase().replace(" dolores","").replace("dolores ","").replace("?","");
  let reply ="";
  let alreadyRegistered = yield spaceModel.isSpaceRegistered(query.roomId);
  if(currentRegisteringUser !== query.roomId && currentRegisteringUser !== "" ){
    reply = "sorry " + query.person.nickName + ", there is a user currently registering, try again later...";
  } else if (alreadyRegistered && cleanQuestion.indexOf("get crashes count on version") !== -1){
    let version = cleanQuestion.replace("get crashes count on version","").replace(" ","");
    let result = yield winReportModel.getCrashesByVersion(version);
    if(result){
      let dates = "";
      let ids = "";
      let count = 0;
      result.forEach(item=>{
        ids += item.id + ", ";
        item.reportDate.forEach(it=>{
          dates += it + ", ";
          count += 1;
        })
      });
      dates = dates.split(',');
      dates.sort();
      reply = query.person.nickName + " version " + version + " has " + count + " windows reported crash(es) between " + dates.slice(-1).pop() +
              " and " + dates[1] + " with the following ids:" +
              "\n\n >" + ids;
    } else {
      reply = "Client version " + version + " has no crashes reported";
    }
  } else if (alreadyRegistered && cleanQuestion.indexOf("get me crash with id") !== -1){
    let crashId = cleanQuestion.replace("get me crash with id","").replace(" ","");
    let crash = yield winReportModel.getCrashById(crashId);
    if(crash){
      let clients= "";
      crash.client_version.forEach(item =>{
        clients += item + ", ";
      })
      reply = "Here we go: " +
                        "\n\n> **Crash Id:** " + crash.id +
                        "\n\n> **First reported:** " + crash.reportDate[0] +
                        "\n\n> **Last reported:** " + crash.reportDate.slice(-1).pop() +
                        "\n\n> **Name:** " + crash.title +
                        "\n\n> **Method affected:** " + crash.method +
                        "\n\n> **Crashes Count:** " + crash.crashes_count +
                        "\n\n> **Client versions afected:** " + clients;
    } else {
      reply = "invalid crash id...";
    }
  }
  else if (alreadyRegistered && cleanQuestion !== "bring yourself back online" && scope ==="") {
    scope = "menuShown";
    lockRegistration(query.roomId);
    console.log("user already registered proceeding to find the question")
    reply = yield dialogModel.retrieveResponsePromised(query);
  } else if(cleanQuestion === "bring yourself back online" || (!alreadyRegistered && scope ==="")) {
    console.log("newUser add asking for menu");
    reply = "What can I do for you " + query.person.nickName + "?"+ showMenu();
    scope = "menuShown"
    lockRegistration(query.roomId);
  } else if (scope !=="") {
      switch(scope) {
        case "menuShown":
          if(cleanQuestion == "1"){
            populateTempSpace(query);
            reply = "Please write the tags you want to filter the crash reports separated by comma " +
                    "for example: *whiteboard*, _auxiliaryDeviceService_,*roomsView*, so I will sent you only the ones you are interested at." +
                    "\n\n- If you want to receive all the crashes reported type \"**everything**\"." +
                    "\n\n- If you don't want to receive any reporte type \"**none**\"." +
                    "\n\n- You can update these options at any time by typing \"**Bring yourself back online**\".";
            scope = "tagsAsked";
          }else if(cleanQuestion == "2"){
            console.log("about to delete the user")
            unlockRegistration();
            reply = yield spaceModel.deleteUserPromified(query.roomId);
          }else if(cleanQuestion == "3"){
            unlockRegistration();
            reply = yield spaceModel.showUserOptionsPromified(query.roomId);
          }else{
            unlockRegistration();
            reply = "incorrect answer";
          }
        break;
        case "tagsAsked":
          tempSpace.macReports.receive = "yes";
          tempSpace.windowsReports.receive="yes";
          // User said it wants to get mac reports populating options. Next question for windows option.
          cleanQuestion = cleanQuestion.replace(" ",""); //remove spaces
          var array = cleanQuestion.split(',');
          if (array[0].toLowerCase() === "none") {
            tempSpace.macReports.receive = "no";
            tempSpace.windowsReports.receive="no";
          }
          for (var i in array) {
            tempSpace.macReports.tags[i] =array[i];
            tempSpace.windowsReports.tags[i] = tempSpace.macReports.tags[i];
          }
          reply = "Would you like to enable this space to receive your splunk alerts?<yes/no>";
          scope = "splunkAsked";
        break;
        case "splunkAsked":
          // user replied to teh Splunk Option. Next is to show the final confirmation.
          if (cleanQuestion === 'yes'){
            tempSpace.splunkReports.receive = "yes";
          }
          else {
            tempSpace.splunkReports.receive = "no";
          }
          var showSpace = showCurrentOptions(tempSpace);
          reply = "This room will be registered with the following options " + space.nickName +":\n" + showSpace.reply() + "\n\nAre they correct?<yes/no>";
          scope = "askedForConfirmation";
        break;
        case "askedForConfirmation":
          scope = "";
          if (cleanQuestion === 'yes') {
            space = copySpace(space).space();
            cleanTempSpace();
            space.save(err =>{
              let saveReply="";
              if (err) {
                saveReply = "error saving to the database, try again later"
              } else {
                console.log("spaced saved to database")
                saveReply = "Welcome to SparkWorld";
              }
              bot.sendRichTextMessage(query.roomId, saveReply , function(){
                                      console.log('Message sent from Bot!');
                                      });
            });
            unlockRegistration();

            return;
          }
          else {
            reply = "Sorry if something was wrong, please try again later";
          }
        break;
      }
  }
  if (mongoUrl ==='mongodb://localhost:27017/spaces'){
      var err = null;
      bot(reply);
  }else {
      bot.sendRichTextMessage(query.roomId, reply , function(){
                              console.log('Message sent from Bot!');
                              });
  }
  return;
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
