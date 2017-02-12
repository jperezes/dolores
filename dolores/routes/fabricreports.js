var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var MacReport = require('../models/macreports');
var Space = require('../models/space');
var mongoUrl = process.env.MONGO_URL_FABRIC || 'mongodb://localhost:27017/reports';

var reports = function(){};


console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
//mongoose.Promise = require('bluebird');

// Connect to DB
if (mongoUrl === 'mongodb://localhost:27017/reports'){
  //mongoose.connect(mongoUrl);
  var conn = mongoose.createConnection('mongodb://localhost:27017/spaces');
  var spaceModel = conn.model('SparkSpace', Space);
  var space = new spaceModel();
} else {
  var conn = mongoose.createConnection(mongoUrl);
  var spaceModel = conn.model('SparkSpace', Space);
  var space = new spaceModel();
}

var userIds=[];
var macReport = new MacReport(); // new instance of a fabric report
var saveReport = function(req) {
  var datetime = new Date();
  macReport.reportDate = datetime;
  macReport.event = req.body.event;
  macReport.payload_type = req.body.payload_type;
  macReport.payload.display_id = req.body.payload.display_id;
  macReport.payload.title = req.body.payload.title;
  macReport.payload.method = req.body.payload.method;
  macReport.payload.impact_level = req.body.payload.impact_level;
  macReport.payload.crashes_count = req.body.payload.crashes_count;
  macReport.payload.impacted_devices_count = req.body.payload.impacted_devices_count;
  macReport.payload.url = req.body.payload.url;

  macReport.save(function(err) {
    if (err) {
      console.log ("error saving to the database");
      res.send(err);
    }
    console.log('Mac Report successfully saved to the database' + JSON.stringify(macReport));
  });

}

reports.prototype.listenForMacReports = function(bot,app){
  this.app = app;
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(bodyParser.json());
  this.app.use('/v1',router);
  router.use(function(req, res, next) {
    //in the future some middleware can be added here.
    // console.log('and it is very weird: ',req);
    next();
  });
  router.route('/fabricreports').post(function(req, res) {
    if (req.body.event === "verification") {
      res.status(200).send('Verified');
    }
    else {
      res.status(200).send('Verified');
      // if we are in a test environment we don't send the message to the bot
      //saveReport(req);
      //Save the date when the query arrived
      saveReport(req);
      if (mongoUrl === 'mongodb://localhost:27017/reports'){
        var err = null;
        bot(err,macReport);
        //spaceModel.getMacReportSubscribers(req,bot,function(){});

      }else{
        // bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, failureReport , function(){
        //   console.log('Message sent from Bot!');
        // });
        //
        // bot.sendMessage(process.env.MAC_REPORTS_ROOM_ID, failureReport , function(){
        //   console.log('Message sent to mac reports room');
        // });
        spaceModel.getMacReportSubscribers(req,bot,function(){});
      }
    }
  });

}

module.exports = router;
module.exports = reports;
