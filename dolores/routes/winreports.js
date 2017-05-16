var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Space = require('../models/space');
let WinReportSchema = require('../models/winCrashModel');
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/spaces';
let Promise= require('bluebird')

var winReports = function(){};
let con = mongoose.createConnection(mongoUrl)
let WinReportModel = con.model('winReport', WinReportSchema);
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

var userIds=[];
var winReport = new WinReportModel(); // new instance of a fabric report
var saveAndSendReport = Promise.coroutine(function*(req,res,bot) {
  winReport.lastReportDate = req.body.reportDate;
  winReport.firstReportDate=req.body.reportDate;
  winReport.hashA = req.body.hashA;
  winReport.title = req.body.title;
  winReport.method = req.body.method;
  winReport.feedback_id = req.body.feedback_id;
  winReport.client_version = req.body.client_version;
  winReport.id = req.body.id;
  winReport.url = req.body.url;

  let result = yield WinReportModel.getCountAndDelete(req.body.hashA);
  if (typeof(result.crashes_count) !=='undefined'){
    winReport.crashes_count = result.crashes_count + 1;
    winReport.firstReportDate = result.firstReportDate;
  } else {
    winReport.crashes_count = 1;
  }

  console.log("incrementing crash count: " + winReport.crashes_count)
  winReport.save(err =>{
    if (err) {
      res.status(500).send(err);
    } else {
      console.log("git issue change saved on the database")
      res.status(200).send('win crash event saved to the database');
    }
  });

  WinReportModel.sendReport(winReport,bot);
})

router.route('/wincrashreports').post(function(req, res) {
    if (req.body.event === "verification") {
      res.status(200).send('Verified');
    } else if (req.headers.authorization !== process.env.AUTH_TOKEN_WIN_REPORTS) {

      bot.sendRichTextMessage(process.env.JUAN_DOLORES_ROOM_ID,"invalid WIN report url received",function(){
        console.log("url not not valid");
      });
      res.status(401).send('Unauthorised');
    } else {
      console.log("about to save and send the report the report to the database");
      saveAndSendReport(req,res,bot);
    }
  });

}

module.exports = winReports;
