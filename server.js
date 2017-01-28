var port = process.env.PORT || 1337;
var sparklite = require("sparklite");
var dialogs = require("./dolores/dialogs");
var botdomain = process.env.DOLORES_URL;
var sparkBot = new sparklite.SparkBot(process.env.DOLORES_KEY, port, botdomain);

var express = require('express');
var stadistics = require('./dolores/routes/stadistics');

var botModule = new stadistics();
// botModule.setBot(sparkBot, "you should correctly see this");


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

      console.log('Incoming message: '+ JSON.stringify(event.message) + ' from: '+event.person.displayName + 'person name not parsed properly');
      sentMessage = dialogs.response(`${event.message}`);//'Hello great maker ' ; //+ event.person.displayName;

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

botModule.listenForStadistics(sparkBot, port);
