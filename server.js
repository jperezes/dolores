var port = process.env.PORT || 1337;
var sparklite = require("sparklite");
var dialogs = require("./dolores/dialogs");
var botdomain = 'doloresbot.azurewebsites.net';
var sparkBot = new sparklite.SparkBot(process.env.DOLORES_KEY, port, botdomain);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

sparkBot.printHelloWorld();

console.log(dialogs.answers[dialogs.response('who is the evil in your religion')].value);
sparkBot.on('message', function (event)
{
  var sentMessage = "";
    console.log('Incoming message: '+ JSON.stringify(event.message) + ' from: '+event.person.displayName );
    if (('#' + event.person.displayName+'#' == '#Juan test#') || ('#' + event.person.displayName+'#' == '#Joan Perez Esteban#')) {

      sentMessage = dialogs.answers[dialogs.response(`${event.message}`)].value;//'Hello great maker ' ; //+ event.person.displayName;
    }
    else {
      console.log('Incoming message: '+ JSON.stringify(event.message) + ' from: '+event.person.displayName + 'person name not parsed properly');
      sentMessage = '#' + event.person.displayName+'#';
    }



    sparkBot.sendMessage(event.roomId, sentMessage , function(){
      console.log('Message sent from Bot!');
    });
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
