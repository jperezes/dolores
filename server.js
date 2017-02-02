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
    dialogModule.parseQuestion(event,sparkBot);    

    console.log(JSON.stringify(event));
})
//console.log(dialog.answers[dialog.response('who is the evil in your religion')].value);
sparkBot.on('rooms', function (event)
{
    console.log(JSON.stringify(event));
})

sparkBot.on('memberships', function (event)
{
    console.log(JSON.stringify(event));
})
var eventual = {"personEmail":"jperezes@cisco.com", "message": "do you know where you are" };


botModule.listenForStadistics(sparkBot, sparkBot.getServer());
macReports.listenForMacReports(sparkBot,sparkBot.getServer());
// dialogModule.getUser(eventual);
// dialogModule.parseQuestion(eventual,sparkBot);
//dialogModule.response("event",sparkBot);
