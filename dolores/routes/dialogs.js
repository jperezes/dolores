let Space = require('../models/space');
let Dialog = require('../models/conversations')
let WinReportSchema = require('../models/winCrashModel')
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let Promise= require('bluebird')
let versions = require('./getClientChannels').versions;
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

let registeredOptions= ["-r","unregister","-aw","-df","-sf","-es","-ds","-so","-sf","-fc", "-sc","-ag", "-mr", "-smr"];

let checkRegisteredOption = function(question){
  let check = ""
  registeredOptions.forEach(item=>{
    if(question.indexOf(item) !== -1){
      console.log("Menu question found")
      check = "found"
    }
  })
  if(check === "found"){
    return true;
  } else{
    console.log("unknown question")
    return false;
  }
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
    return "\n\n1. Register Space \n\n2. Unregister Space" +
    "\n\n3. Show current space registration options" +
    "\n\n4. Show crash managements options" +
    "\n\n\n Select <1><2><3><4>";
}
let showCrashOptions = function(){
  let options = "\n\n Usage:" +
                "\n      dolores [-h] [-help]  to print options" +
                "\n              [-cv <Spark version>] show crash number of the specified Spark version" +
                "\n              [-i <crash id>] show crash info" +
                "\n              [-o <crash id>] show crash occurrences" +
                "\n              [-r <crash id> <Spark fix version>] mark crash as resolved on version" +
                "\n              [-aw <word1, word2 ...>] add keyword(s) to the crash triage filter" +
                "\n              [-mr] <number> max number of crash reproductions to be reported to this room" +
                "\n              [-fc] <color1, color2, ...> filter by channels" +
                "\n              [-sf] show channel filter" +
                "\n              [-pc] show current channel client versions" +
                "\n              [-sf] show triage filter keywords" +
                "\n              [-df] delete trieage filter keywords" +
                "\n              [-so] show user registration options" +
                "\n              [-es] enable splunk alerts on the space" +
                "\n              [-ds] disable splunk alerts on the space" +
                "\n              [-ag] <crash id> add github url to the crash" +
                "\n              [register] register space" +
                "\n              [unregister] unregister space" +
                "\n              [-m] show space options menu";


  return options;
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
  let winReport = new winReportModel();
   console.log("THE SCOPE IS: " + scope);
  let cleanQuestion = query.message.toLowerCase().replace(" dolores","").replace("dolores ","").replace("?","");
  //console.log("clean question is: " + cleanQuestion);
  let reply ="";
  let alreadyRegistered = yield spaceModel.isSpaceRegistered(query.roomId);
  if(!alreadyRegistered && checkRegisteredOption(cleanQuestion)){
    reply = "You'll need to be registered to do that mate ;)"
  } else if ((cleanQuestion.indexOf("get crashes count on version") !== -1 || cleanQuestion.indexOf("-cv") !==-1)){
    let version = cleanQuestion.replace("get crashes count on version","").replace("-cv","").replace(" ","");
    let result = yield winReportModel.getCrashesByVersion(version);
    if(result){
      let dates = "";
      let ids = "";
      let count = 0;
      result.forEach(item=>{
        ids += item.id + ", ";
        count += 1;
        item.reportDate.forEach(it=>{
          dates += it + ",";
        })
      });
      dates = dates.slice(0,-1);
      dates = dates.split(',');
      dates.sort();
      reply = query.person.nickName + " version " + version + " has " + count + " windows reported crash(es) between " + dates[0] +
              " and " + dates.slice(-1).pop() + " with the following ids:" +
              "\n\n >" + ids;
    } else {
      reply = "Client version " + version + " has no crashes reported";
    }
  } else if ((cleanQuestion.indexOf("get me crash with id") !== -1 || cleanQuestion.indexOf("-i") !==-1)){
    let crashId = cleanQuestion.replace("get me crash with id","").replace("-i","").replace(" ","");
    let crash = yield winReportModel.getCrashById(crashId);
    if(crash){
      let clients= "";
      crash.client_version.forEach(item =>{
        clients += item + ", ";
      })
      let fixedVersion = ""
      let team_assigned = ""
      let crashDumpUrlText = ""
      if (typeof(crash.assigned_team) !== 'undefined') {
        team_assigned = "\n\n> **Team Assigned:** " + crash.assigned_team;
      }
      if (typeof(crash.is_resolved ) !== 'undefined') {
        fixedVersion = "\n\n> **Fixed version:** " + crash.is_resolved;
      }
      if(typeof(crash.crashDumpUrl) !== 'undefined') {
        crashDumpUrlText = "\n\n> **Link to crash dump:** " + "[Download dump file]" + "("+ crash.crashDumpUrl + ")";
      }
      reply = "Here we go: " +
                        "\n\n> **Crash Id:** " + crash.id +
                        "\n\n> **First reported:** " + crash.reportDate[0] +
                        "\n\n> **Last reported:** " + crash.reportDate.slice(-1).pop() +
                        "\n\n> **Name:** " + crash.title +
                        "\n\n> **Hash:** " + crash.hashA +
                        "\n\n> **Hash C:** " + crash.hashC +
                        "\n\n> **Method affected:** " + crash.method +
                        "\n\n> **Crashes Count:** " + crash.crashes_count +
                        "\n\n> **Distinct users afected:** " + crash.usersAfected.length +
                        team_assigned +
                        fixedVersion +
                        crashDumpUrlText +
                        "\n\n> **Github issue url:** " + crash.githubUrl +
                        "\n\n> **Client versions afected:** " + clients;
    } else {
      reply = "invalid crash id...";
    }
  }else if ((cleanQuestion.indexOf("get me occurrences of crash with id") !== -1 || cleanQuestion.indexOf("-o") !==-1)){
    let crashId = cleanQuestion.replace("get me occurrences of crash with id","").replace("-o","").replace(" ","");
    let crash = yield winReportModel.getCrashById(crashId);
    if(crash){
      let dates= "";
      crash.reportDate.forEach(item =>{
        dates += item + ", ";
      })
      reply = "Crash id " + crash.id + " has been reported " + crash.crashes_count + " times on the followind dates:" +
              "\n\n> " + dates;
    } else {
      reply = "invalid crash id...";
    }
  } else if ((cleanQuestion.indexOf("unregister") !==-1)){
    reply = yield spaceModel.deleteUserPromified(query.roomId);
  } else if ((cleanQuestion.indexOf("register") !== -1 )){
    //show filter keywords
    space.roomId = query.roomId;
    space.roomType = query.roomType;
    space.personName = query.person.displayName;
    space.personEmail = query.personEmail;
    space.nickName = query.person.nickName;
    space.splunkReports.receive="no"
    space.macReports.receive="no";
    space.windowsReports.receive="no";
    let registration = yield spaceModel.registerSpace(space);
    if(registration){
      reply = "Welcome to SparkWorld " + query.person.nickName + "!";
    } else{
      reply = "Failed to register the user, try again later";
    }
  }  else if ((cleanQuestion.indexOf("set as resolved crash with id") !== -1 || cleanQuestion.indexOf("-r") !==-1)){
    let crashAndVersion = cleanQuestion.replace("set as resolved crash with id","").replace("-r","").replace(" ","");
    let vecReply = crashAndVersion.split(" ");
    let crashId = vecReply[0];
    let version="";
    if(typeof(vecReply[1] !== 'undefined')) {
      version = vecReply[1];
    }

    let setFixed = yield winReportModel.setCrashAsFixed(crashId,version);
    if(setFixed){
      reply = "crash id " + crashId + " has been set as fixed on version " + version + ", no reports will be sent unless is reported in a newer version";
    } else {
      reply = "problem seeting the crash as fixed, pleasy try again later";
    }
  } else if ((cleanQuestion.indexOf("help") !== -1 || cleanQuestion.indexOf("-h") !==-1)){
    reply = showCrashOptions();
  } else if ((cleanQuestion.indexOf("-so") !==-1)){
    reply = yield spaceModel.showUserOptionsPromified(query.roomId);
  } else if ((cleanQuestion.indexOf("-es") !==-1)){
    reply = yield spaceModel.enableSplunk(query.roomId);
  } else if ((cleanQuestion.indexOf("-ds") !==-1)){
    reply = yield spaceModel.disableSplunk(query.roomId);
  }else if ((cleanQuestion.indexOf("-aw") !== -1)){
    //add word(s) to triage the filter
    let keyword = cleanQuestion.replace("-aw","").replace(" ","");
    reply = yield spaceModel.addFilterKeyWord(query.roomId,keyword)
  } else if ((cleanQuestion.indexOf("-fc") !== -1)){
    //add word(s) to triage the filter
    let keyword = cleanQuestion.replace("-fc","").replace(" ","");
    reply = yield spaceModel.addChannelFilter(query.roomId,keyword)
  } else if ((cleanQuestion.indexOf("-sf") !== -1)){
    //show filter keywords
    let filter = yield spaceModel.showFilterWords(query.roomId);
    reply = "Keywords filter for this room are: _" + filter + "_";
  }else if ((cleanQuestion.indexOf("-sul") !== -1)){
    //show filter keywords
    let crashID = cleanQuestion.replace("-sul","").replace(" ","");
    let arrayUsers = yield winReportModel.getCrashUserList(crashID);
    reply = "users affected by this crash are: _" + arrayUsers + "_";
  }else if ((cleanQuestion.indexOf("-sids") !== -1)){
    //show filter keywords
    let keyword = cleanQuestion.replace("-sids","").replace(" ","");
    let crashIds = yield winReportModel.getCrashesIdsByStackTraceKeyword(keyword);
    reply = "crashes ids with " + keyword +  " in the stacktrace are: _" + crashIds + "_";
  } else if ((cleanQuestion.indexOf("-suid") !== -1)){
    //show filter keywords
    let userId = cleanQuestion.replace("-suid","").replace(" ","");
    let crashIds = yield winReportModel.getCrashesByUserId(userId);
    reply = "crashes ids for user id " + userId +  " are: _" + crashIds + "_";
  } else if ((cleanQuestion.indexOf("-mr") !== -1)){
    let maxReports = cleanQuestion.replace("-mr","").replace(" ","");
    let maxReportInt = parseInt(maxReports,10)
    let success = yield spaceModel.setMaxReproductionsToReport(query.roomId, maxReportInt);
    reply = success;
  } else if ((cleanQuestion.indexOf("-smr") !== -1)){
    let success = yield spaceModel.showMaxReproductionsToReport(query.roomId);
    reply = "max number of crash reproductions is:" + success;
  }else if ((cleanQuestion.indexOf("-sc") !== -1)){
      //show filter keywords
      let filter = yield spaceModel.showChannelsRegisterd(query.roomId);
      reply = "Your channels are: _" + filter + "_";
  }  else if ((cleanQuestion.indexOf("-ag") !== -1)){
    //add github url to the crash
    let keywords = cleanQuestion.split(" ");
    let crashId = keywords[1]
    let url = keywords[2]
    let log = "crashId is: " + crashId + " url is: " + url;
    console.log(log)
    //let keyword = cleanQuestion.replace("-ag","").replace(" ","");
    reply = yield winReportModel.addGitHubUrl(crashId,url);
  }else if ((cleanQuestion.indexOf("-df") !== -1)){
    //delete triage filter words, disable crash alerts.
    let keyword = cleanQuestion.replace("-df","").replace(" ","");
    reply = yield spaceModel.deleteAllFilterWord(query.roomId)
  } else if ((cleanQuestion.indexOf("-pc") !== -1)){
      //show filter keywords
      reply = "Actual channel versions are: " +
               " \n\n - blue: " + versions[0] +
               " \n\n - purple: " + versions[1] +
               " \n\n - green: " + versions[2] +
               " \n\n - gold: " + versions[3];

  }else if (cleanQuestion !== "bring yourself back online" && (cleanQuestion.indexOf("-m") ===-1) && scope ==="") {
    //scope = "menuShown";
    //lockRegistration(query.roomId);
    console.log("user already registered proceeding to find the question")
    reply = yield dialogModel.retrieveResponsePromised(query);
  }else if(currentRegisteringUser !== query.roomId && currentRegisteringUser !== "" ){
      reply = "sorry " + query.person.nickName + ", there is a user currently registering, try again later...";
  }else if(cleanQuestion === "bring yourself back online" || cleanQuestion.indexOf("-m") !==-1 || (!alreadyRegistered && scope ==="")) {
    console.log("newUser add asking for menu");
    reply = "What can I do for you " + query.person.nickName + "?"+ showMenu();
    scope = "menuShown"
    lockRegistration(query.roomId);
  } else if (scope !=="") {
      switch(scope) {
        case "menuShown":
          if(cleanQuestion == "1"){
            populateTempSpace(query);
            reply = "Please write the tags you want to filter the crash reports separated by comma, " +
                    "for example: *whiteboard*, _auxiliaryDeviceService_,*roomsView*, so I will sent you only the ones you are interested at." +
                    "\n\n- If you want to receive all MAC crashes reported type \"**everything**\" " +
                    "\n\n- To get all Windows crashes only type \"**none, everything**\"" +
                    "\n\n- To get ALL crashes on MAC and Win type \"**everything,everything**\" ( is not recomended as there is \"**All Spark Crashes**\" room for that)" +
                    "\n\n- If you don't want to receive anything type \"**none**\" (You'll still be able to use the bot to query crashes or chat when bored)." +
                    "\n\n- You can update these options at any time by typing \"**Bring yourself back online**\" or \"**-m**\".";
            scope = "tagsAsked";
          }else if(cleanQuestion == "2"){
            console.log("about to delete the user")
            unlockRegistration();
            reply = yield spaceModel.deleteUserPromified(query.roomId);
          }else if(cleanQuestion == "3"){
            unlockRegistration();
            reply = yield spaceModel.showUserOptionsPromified(query.roomId);
          }else if (cleanQuestion === "4"){
            unlockRegistration();
            reply = showCrashOptions();
          }
          else{
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
