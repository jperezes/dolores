var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var SpaceSchema = require('../models/space');
let WinReportSchema = require('../models/winCrashModel');
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/spaces';
let Promise= require('bluebird')
mongoose.set('debug', true);


var winReports = function(){};
let con = mongoose.createConnection(mongoUrl)
let WinReportModel = con.model('winReport', WinReportSchema);
let SpaceModel = con.model('SparkSpace', SpaceSchema);
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
  winReport.title = req.body.title;
  winReport.method = req.body.method;
  winReport.feedback_id = req.body.feedback_id;
  winReport.client_version = req.body.client_version;
  winReport.url = req.body.url;

  let result = yield WinReportModel.getCountAndDelete(req.body.hashA);
  if (typeof(result.reportDate) !== 'undefined'){

    result.reportDate.push(req.body.reportDate);
    result.reportDate.sort();
    result.crashes_count = result.crashes_count +1;
    roomsIdSet = yield SpaceModel.getWinReportSubscribers(result);
    if(roomsIdSet !== null){
      for(var roomId of roomsIdSet.values()){
       console.log("Number of users found:" + roomsIdSet.size);
       WinReportModel.sendReport(result,bot,roomId);
      }
    }
    result.save(function(err){
      if(err){
        res.status(500).send("error updating the crash into the database" + err);
      } else {
        res.status(200).send('win crash event updated');
      }
    })

  } else {
    winReport.crashes_count = 1;
    let count = 0
    WinReportModel.count({},(err,result)=>{
      if(err){
        throw err;
      } else {
        return result;
      }
    }).then(result => {
      console.log("number of found documents is: " + result)
      winReport.id = result + 1;
      winReport.save(err =>{
        if (err) {
          throw err;
        } else {
          console.log("git issue change saved on the database")
          res.status(200).send('win crash event saved to the database');
        }
      });
    }).catch(err => res.status(500).send("error accessing the database"))
    roomsIdSet = yield SpaceModel.getWinReportSubscribers(winReport);
    if(roomsIdSet !== null){
      for(var roomId of roomsIdSet.values()){
       console.log("nuber of users found:" + roomsIdSet.size);
       WinReportModel.sendReport(winReport,bot,roomId);
      }
    }
  }
  //WinReportModel.sendReport(winReport,bot);
})

router.route('/wincrashreports').post(function(req, res) {
    if (req.body.event === "verification") {
      res.status(200).send('Verified');
    } else if (req.headers.authorization !== process.env.AUTH_TOKEN_WIN_REPORTS){

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
