var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Splunk = require('../models/queries');
var mongoUrl = process.env.MONGO_URL;

var botModule = function(){};
var botSpark;
var messageTest;
botModule.prototype.setBot = function(bot, message){
  botSpark = bot;
  this.messageTest = message;
}

//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
mongoose.connect(mongoUrl);
console.log('Connected to the database');

botModule.prototype.listenForStadistics = function(bot,app){
  this.app = app;
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(bodyParser.json());
  this.app.use('/v1',router);
  router.use(function(req, res, next) {
    console.log('FYI...There is some processing currently going down...');

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
    });

    var messageToSend = "Splunk Alert!\nAlert Name :" + req.body.search_name +
                        "\nResult: " + req.body.result.count +
                        "\nSearch url: " + req.body.results_link;

    //Send result to the room
    bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, messageToSend, function(){
      console.log('Message sent from Bot!');
    });
  });

  router.route('/stadistics').get(function(req, res) {
    //TODO: Get stadistics saved on the database
  });

}



module.exports = router;
module.exports = botModule;
