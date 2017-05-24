let port = process.env.PORT || 1337;
let sparklite = require("sparklite");
let botdomain = process.env.DOLORES_URL;
let sparkBot = new sparklite.SparkBot(process.env.DOLORES_KEY, port, botdomain);

let stadistics = require('./dolores/routes/stadistics');
let fabricModule = require('./dolores/routes/fabricreports');
let Dialog = require('./dolores/routes/dialogs');
let GitRoute = require('./dolores/routes/gitIssuesRoute')
let issueSchedule = require('./dolores/routes/gitUpdates')
let WinReport = require('./dolores/routes/winreports');

let botModule = new stadistics();
let macReports = new fabricModule();
let dialogModule = new Dialog();
let gitServer = new GitRoute();
let winReports = new WinReport();


process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

sparkBot.printHelloWorld();

sparkBot.on('message', function (event)
{
   var mail = event.personEmail.split('@');

   if (mail[1] === "cisco.com"){
     dialogModule.parseQuestion(event,sparkBot);
   } else {
     sparkBot.sendMessage(event.roomId, "Hi, sorry to tell you that but you're not allowed to proceed",function(){});
   }
  console.log(JSON.stringify(event));

})
sparkBot.on('rooms', function (event)
{
    console.log(JSON.stringify(event));
})

sparkBot.on('memberships', function (event)
{
    console.log(JSON.stringify(event));
})

let bot = function(result){
  console.log(result);
}

botModule.listenForStadistics(sparkBot, sparkBot.getServer());
macReports.listenForMacReports(sparkBot,sparkBot.getServer());
gitServer.listenForGitUpdates(sparkBot,sparkBot.getServer());
winReports.listenForWinReports(sparkBot,sparkBot.getServer());
issueSchedule(sparkBot);

// let fake_event = {
//   roomId:"fake_romId1",
//   message:"get me occurrences of crash with id 15",
//   person:{
//     nickName:"superJuan"
//   }
// }
//
// dialogModule.parseQuestion(fake_event,bot);
