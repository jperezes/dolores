var port = process.env.PORT || 1337;
var sparklite = require("sparklite");
var botdomain = process.env.DOLORES_URL;
var sparkBot = new sparklite.SparkBot(process.env.DOLORES_KEY, port, botdomain);

var stadistics = require('./dolores/routes/stadistics');
var fabricModule = require('./dolores/routes/fabricreports');
var dialogs = require("./dolores/dialogs");

var botModule = new stadistics();
var macReports = new fabricModule();
//var dialog = new dialogs();


process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

sparkBot.printHelloWorld();

sparkBot.on('message', function (event)
{
  var sentMessage = "";
    console.log('Incoming message: '+ JSON.stringify(event.message) + ' from: '+event.person.displayName );
    if (('#' + event.person.displayName+'#' == '#Juan test#') ||
    (event.roomId === process.env.JUAN_DOLORES_ROOM_ID) ||
    ('#' + event.person.displayName+'#' == '#Diego Becerra#') ||
    ('#' + event.person.displayName+'#' == '#Joan Perez Esteban#')) {

      dialog.updateTempSpace(event);

      console.log('Incoming message: '+ JSON.stringify(event.message) + ' from: '+event.person.displayName + 'person name not parsed properly');
      sentMessage = dialog.response(event,sparkBot);

    }
    else {
      console.log('Incoming message: '+ JSON.stringify(event.message) + ' from: '+event.person.displayName + 'person name not parsed properly');
      sentMessage = '#' + event.person.displayName+'#';
    }

//send message inside the function now, so no needs of this
    // sparkBot.sendMessage(event.roomId, sentMessage , function(){
    //   console.log('Message sent from Bot!');
    // });

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

botModule.listenForStadistics(sparkBot, sparkBot.getServer());
macReports.listenForMacReports(sparkBot,sparkBot.getServer());
