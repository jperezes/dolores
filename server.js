var port = process.env.PORT || 1337;
var sparklite = require("sparklite");
var botdomain = process.env.DOLORES_URL;
var sparkBot = new sparklite.SparkBot(process.env.DOLORES_KEY, port, botdomain);

var stadistics = require('./dolores/routes/stadistics');
var fabricModule = require('./dolores/routes/fabricreports');
var Dialog = require('./dolores/routes/dialogs');

var botModule = new stadistics();
var macReports = new fabricModule();
var dialogModule = new Dialog();


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

botModule.listenForStadistics(sparkBot, sparkBot.getServer());
macReports.listenForMacReports(sparkBot,sparkBot.getServer());
