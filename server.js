var port = process.env.PORT || 1337;
var sparklite = require("sparklite");
var botdomain = 'doloresbot.azurewebsites.net';
var sparkBot = new sparklite.SparkBot(DOLORES_KEY, port, botdomain);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

sparkBot.printHelloWorld();

sparkBot.on('message', function (event)
{
    console.log('Incoming message: '+ JSON.stringify(event.message) + ' from: '+event.person.displayName );
    var sentMessage = 'Hello great maker ' + event.message; //+ event.person.displayName;

    sparkBot.sendMessage(event.roomId, sentMessage , function(){
      console.log('Message sent from Bot!');
    });
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
