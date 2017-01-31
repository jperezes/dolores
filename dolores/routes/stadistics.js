var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Splunk = require('../models/queries');
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/spaces';

var botModule = function(){};
var botSpark;
var messageTest;
botModule.prototype.setBot = function(bot, message){
  botSpark = bot;
  this.messageTest = message;
}


//// TODO: DELETE THIS BLOCK AS IS JUST FOR TESTING

var Space = require('../models/space');
var tempSpace = { "Id": "Test rooom ID",
    "isRoom": "Yes",
    "isone2one": "no",
    "personId": "jperezes",
    "personName": "joan perez",
    "personEmail": "test@gmail.com"};
//////////////


console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
mongoose.connect(mongoUrl);


botModule.prototype.listenForStadistics = function(bot,app){
  this.app = app;
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(bodyParser.json());
  this.app.use('/v1',router);
  router.use(function(req, res, next) {
    //in the future some middleware can be added here.
    // console.log('and it is very weird: ',req);
    next();
  });
  router.route('/stadistics').post(function(req, res) {

    //Save the date when the query arrived
    var datetime = new Date();
    console.log(datetime);

    var stats = new Splunk(); // new instance of a Splunk result
    stats.alertDate = datetime;
    stats.result.count = req.body.result.count;
    stats.app = req.body.app;
    stats.results_link = req.body.results_link;
    stats.owner = req.body.owner;
    stats.search_name = req.body.search_name;
    stats.sid = req.body.sid;

    stats.save(function(err) {
      if (err) {
        res.send(err);
      }
      res.json({message: 'Splunk result successfully saved to the database'});
      res.status(200).send('Verified');
    });

    var messageToSend = "Splunk Alert!\nAlert Name :" + req.body.search_name +
                        "\nResult: " + req.body.result.count +
                        "\nSearch url: " + req.body.results_link;

    //Send result to the room
    bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, messageToSend, function(){
      console.log('Message sent from Bot!');
    });
  });

  router.route('/stadistics/:personEmail').get(function(req, res) {
    //TODO: Get stadistics saved on the database

    Space.find({make:req.params.personEmail}, function(err, space) {
      if (err) {
        res.send(err);
      }
      res.json(space);
    });

    updateTempSpace(tempSpace);
    registerSpace();
  });

  router.route('/stadistics/registerSpace').post(function(req, res) {
    //TODO: Get stadistics saved on the database
    console.log('Trying to retrieve bot info from the database');
    Space.find({personEmail:req.body.personEmail}, function(err, space) {
      if (err) {
        res.send(err);
      }
      if (!space.length) {
        var space = new Space();
        updateTempSpace(space, req.body);
        //res.json({message: 'Space result successfully saved to the database' + req.body.personEmail});
        space.save(function(err) {
          if (err) {
            res.send(err);
          }
          res.json({message: 'Space result successfully saved to the database' +  req.body.personEmail});
          //res.status(200).send('Verified');
        });

      }
      else {
        res.json({message: 'Space already registered'});
      }
    });

  });

  router.route('/stadistics/deleteSpace/:email').get(function(req, res) {
    //TODO: Get stadistics saved on the database
    console.log('Trying to delete bot info from the database' + req.params.email);
    Space.find({personEmail:req.params.email}).remove(function(err,removed){
      if (err) {
        res.send(err);
      }
      res.json({message: 'Space result successfully saved to the database ' +  removed});
    });

  });

}

function showMenu(){
  var menu = "\n1: Register" + "\n2: update user" + "\n3: Delete User";
}

module.exports = router;
module.exports = botModule;
