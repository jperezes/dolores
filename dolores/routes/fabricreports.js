var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var MacReport = require('../models/macreports');
var mongoUrl = process.env.MONGO_URL_FABRIC || 'mongodb://localhost:27017/reports';

var reports = function(){};


console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
mongoose.createConnection(mongoUrl);


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

    //Save the date when the query arrived
    var datetime = new Date();
    console.log(datetime);

    var macReport = new MacReport(); // new instance of a fabric report
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


    var failureReport = "Mac crash received: " +
                        "\nevent: " + req.body.event +
                        "\npayload Type: " + req.body.payload_type +
                        "\ndisplay ID: " + req.body.payload.display_id +
                        "\ntitle: " + req.body.payload.title +
                        "\nmethod affected: " + req.body.payload.method +
                        "\nimpact_level: " + req.body.payload.impact_level  +
                        "\ncrashes_count: " + req.body.payload.crashes_count +
                        "\nimpacted_devices_count: " + req.body.payload.impacted_devices_count +
                        "\nurl to the crash: " + req.body.payload.url;

    if (req.body.event === "verification") {
      //res.status(200).send('Verified');
    }
    else {
      res.status(200).send('Verified');
      bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, failureReport , function(){
        console.log('Message sent from Bot!');
      });

      macReport.save(function(err) {
        if (err) {
          res.send(err);
        }
        console.log('Mac Report successfully saved to the database' + JSON.stringify(macReport));
      });

    }

  });

}

module.exports = router;
module.exports = reports;
