var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Splunk = require('../models/queries');
var Space = require('../models/space');
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/spaces';
var spaceUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';

var botModule = function(){};
var botSpark;
var messageTest;
botModule.prototype.setBot = function(bot, message){
  botSpark = bot;
  this.messageTest = message;
}


console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DBs
mongoose.connect(mongoUrl);
var conn = mongoose.createConnection(spaceUrl)
var spaceModel = conn.model('SparkSpace', Space);
var space = new spaceModel();

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
    console.log("slunk data received: " + req);

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
      } else {
        res.status(200).send('Splunk result successfully saved to the database');
      }

    });
    spaceModel.getSplunkSubscribers(req,bot,function(){});
  });
  
  router.route('/faststats').post(function(req, res) {
    spaceModel.getSplunkUsers().then(subscribers =>{
      let splunkReport = "Splunk Alert: " +
                        "\n\n- **Search Name:** " + req.body.search_name +
                        "\n\n- **Result:** " + req.body.result.count +
                        "\n\n- **Result link:** " + "[splunk dasboard]" + "("+req.body.results_link +")";
      subscribers.forEach((roomId) => {
          bot.sendRichTextMessage(roomId,splunkReport,function(){
            console.log("user found about to send him a message");
          });
      })
    });
  });
}

function registerSpace(space, tempSpace){
  space.roomId = tempSpace.roomId;
  space.roomType = tempSpace.roomType;
  //space.personName = tempSpace.person.displayName;
  space.personEmail = tempSpace.personEmail;
  space.nickName = tempSpace.nickName;

  space.save(function(err) {
    if (err) {
      console.log('error saving to the database' + space.personEmail);
    }
      console.log('user saved to the database' + space.personEmail);
  });
}

function showMenu(){
  var menu = "\n1: Register" + "\n2: update user" + "\n3: Delete User";
}

module.exports = router;
module.exports = botModule;
