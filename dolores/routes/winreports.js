var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var SpaceSchema = require('../models/space');
let WinReportSchema = require('../models/winCrashModel');
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/spaces';
let mongoSp = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';
let Promise= require('bluebird')
let updateVersions = require('./getClientChannels').updateVersions;
mongoose.set('debug', true);


var winReports = function(){};
let con = mongoose.createConnection(mongoUrl)
let WinReportModel = con.model('winReport', WinReportSchema);
var conn2 = mongoose.createConnection(mongoSp)
let SpaceModel = conn2.model('SparkSpace', SpaceSchema);


winReports.prototype.listenForWinReports = function(bot,app){
  this.app = app;
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(bodyParser.json());
  this.app.use('/v1',router);
  router.use(function(req, res, next) {
    //in the future some middleware can be added here.
    // console.log('and it is very weird: ',req);
    next();
  });

//To avoid promise warning
mongoose.Promise = global.Promise;
//mongoose.Promise = require('bluebird');
var saveAndSendReport = Promise.coroutine(function*(req,res,bot) {
  let winReport = new WinReportModel(); // new instance of a fabric report
  winReport.reportDate.push(req.body.reportDate);
  winReport.hashA = req.body.hashA;
  winReport.hashC = req.body.hashC;
  winReport.title = req.body.title;
  winReport.method = req.body.method;
  winReport.feedback_id = req.body.feedback_id;
  winReport.client_version = req.body.client_version;
  winReport.crashDumpUrl = req.body.dump_available;
  winReport.url = req.body.url;
  winReport.usersAfected = req.body.userId

  let result = yield WinReportModel.getCrashByHash(req.body.hashC);
  if (typeof(result.reportDate) !== 'undefined'){
    console.log("crash already reported")
    if(result.client_version.indexOf(req.body.client_version) === -1){
      result.client_version.push(req.body.client_version);
      result.client_version.sort();

      //changes to set the client version
      // if(result.is_resolved === "true"){
      //   console.log("possible regression")
      //   result.is_resolved = "false";
      // }
    }
    //check if usersId is not present in the array already
    if(typeof(req.body.userId) !== 'undefined' && result.usersAfected.indexOf(req.body.userId) === -1){
      result.usersAfected.push(req.body.userId);
    }
    result.reportDate.push(req.body.reportDate);
    result.reportDate.sort();
    result.feedback_id=req.body.feedback_id;
    result.crashes_count = result.crashes_count +1;
    let splitUrl = req.body.dump_available.split(":")
    if(typeof(splitUrl[1]) !== 'undefined') {
      result.crashDumpUrl = req.body.dump_available;
    }

    result.save(function(err){
      if(err){
        res.status(500).send("error updating the crash into the database" + err);
      } else {
        res.status(200).send('win crash event updated');
      }
    })
    // if(result.is_resolved !== "true"){
    //   yield SpaceModel.sendReportToWinSubscribers(result,bot);
    // }
    yield SpaceModel.sendReportToWinSubscribers(result,bot);
  } else {
    console.log("New crash! ")
    winReport.crashes_count = 1;
    result = yield WinReportModel.getCountId();
    winReport.id = result + 1;
    winReport.save(err =>{
      if (err) {
        throw err;
      } else {
        console.log("git issue change saved on the database")
        res.status(200).send('win crash event saved to the database');
      }
    });
    yield SpaceModel.sendReportToWinSubscribers(winReport,bot);
  }
})

router.route('/wincrashreports').post(function(req, res) {
    if (req.body.event === "verification") {
      //update the channels
      res.status(200).send('Verified');
    } else if (req.headers.authorization !== process.env.AUTH_TOKEN_WIN_REPORTS){
      updateVersions();
      bot.sendRichTextMessage(process.env.JUAN_DOLORES_ROOM_ID,"invalid WIN report url received",function(){
        console.log("url not not valid");
      });
      res.status(401).send('Unauthorised');
    } else {
      updateVersions();
      console.log("about to save and send the report the report to the database");
      saveAndSendReport(req,res,bot);
    }
  });
}

module.exports = winReports;
