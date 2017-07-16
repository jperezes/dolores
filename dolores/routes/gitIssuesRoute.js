var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Space = require('../models/space');
let GitIssueSchema = require('../models/gitissuesModel');
let WinReportSchema = require('../models/winCrashModel');
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/spaces';
let mongoSp = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';
let Promise = require('bluebird');


var gitRoute = function(){};

//check if this is necessary
let con = mongoose.createConnection(mongoUrl)
let winReportModel = con.model('winReport', WinReportSchema);
var conn2 = mongoose.createConnection(mongoSp)
let spaceModel = conn2.model('SparkSpace', Space);

let gitIssueModel = mongoose.model('GitIssue', GitIssueSchema);


gitRoute.prototype.listenForGitUpdates = function(bot,app){
  this.app = app;
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(bodyParser.json());
  this.app.use('/v1',router);
  router.use(function(req, res, next) {
    //in the future some middleware can be added here.
    // console.log('and it is very weird: ',req);
    next();
  });
  let teamSpaces= [process.env.TEAM_SCRUM,process.env.CALL_SCRUM,process.env.MESSAGE_SCRUM,process.env.PROGRAM_SCRUM];

  let checkForTeamSpaces = function(ghLabel){
    let check = ""
    teamSpaces.forEach(item=>{
      if(ghLabel.indexOf(item) !== -1){
        console.log("Valid team found")
        check = "found"
      }
    })
    if(check === "found"){
      return true;
    } else{
      console.log("unknown question")
      return false;
    }
  }

  let checkForHash = function(message) {
    var token1 = "Hash A";
    var token2 = "Crash Hash";
    var hashFound ="";
    var n1 = message.indexOf(token1);
    var n2 = message.indexOf(token2);
    let n = n1 > n2 ? n1 : n2;
    var substr = "";
    if (n !== -1) {
        //this is to be sure we get the hash
        substr = message.substring(n,n+50);
        n = substr.indexOf('0x');
        if(n !== -1) {
          hashFound= substr.substring(n,n+ 18);
          console.log("crash with found, id: " + hashFound);
        } else {
          console.log("hash not found weird")
        }
    }
    return hashFound;
  }


  let getTeamRoomId = function(teamName) {
    let roomId = "";
    console.log("getting id for team name: " + teamName)
    if(teamName.indexOf(process.env.TEAM_SCRUM) !== -1) {
      roomId = process.env.PROTEUS_ROOM_ID;
    } else if(teamName.indexOf(process.env.CALL_SCRUM) !== -1) {
      roomId = process.env.CALL_ROOM_ID;
    } else if(teamName.indexOf(process.env.MESSAGE_SCRUM) !== -1) {
      roomId = process.env.MESSAGE_ROOM_ID;
    } else if(teamName.indexOf(process.env.PROGRAM_SCRUM) !== -1) {
      roomId = process.env.PROGRAM_ROOM_ID;
    }
    return roomId;
  }

let processGHCrash = Promise.coroutine(function*(ghIssue,teamName,bot){
      console.log("about to search id for team name: " + teamName)
      let room_id =  getTeamRoomId(teamName);
      let reply = "";
      if (room_id ===""){
        console.log("room_id not found for that team name aborting ...")
        return;
      }
      if((ghIssue.action !== "open") && (ghIssue.action !== "opened") && (ghIssue.action !== "reopened")) {
        //only new reports will be sent to the teams, any other modification shall be ignored
        console.log("action not open aborting ...")
        return;
      }

      //check if issue has a Hash and it has been reported to dolores
      let hashA = checkForHash(ghIssue.issue.body);
      if ( hashA === "" ) {
        //no hash
        reply = "Hi *" + teamName + "* A GH crash has been assigned to your team:\n\n" +
                "\n\n - [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                "\n\n This crash has not yet been reported to the crash server, please add filter key word present on the stack trace " +
                "to identify it and get reports to this room *Dolores -aw <keywords>*";
      } else{
        // hash found
        let crash = yield winReportModel.getCrashByHash(hashA);
        if(typeof(crash.reportDate) !== 'undefined') {
          console.log("git hub crash found on the database")
          crash.assigned_team = teamName;

          //Add the hash to the team id to get further crashes.
          console.log("adding keyword to the database...");
          let result = yield spaceModel.addFilterKeyWordDistinct(room_id,hashA)
          console.log(result);
          //process the reply on failure

          reply = "Hi *" + teamName + "* A GH crash has been assigned to your team:\n\n" +
                  "\n\n > [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                  "\n\n > Reported crash id: " + crash.crash_id +
                  "\n\n > Reported crash hash: " + crash.hashA +
                  "\n\n > First occurrence: " + crash.reportDate[0] +
                  "\n\n \nAny further occurrences of the same crash will be reported to this room, to get info about the crash type *Dolores -i <crash id>*";
          crash.save(function(err){
            if(err) {
              console.log("error saving the crash")
            }
          });
        }
        else {
          //crash not yet reported
          reply = "Hi *" + teamName + "* A GH crash has been assigned to your team:\n\n" +
                  "\n\n - [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                  "\n\n This crash has not yet been reported to Dolores, adding the hash to the filter so further reports will be sent to this space ";

          //Add the hash to the team id to get further crashes.
          yield spaceModel.addFilterKeyWord(room_id,hashA)
        }
      }

      //send it to the team

      bot.sendRichTextMessage(room_id,reply,function(){
        console.log("message sent to the team");
      });


   })

  router.route('/githubupdate').post(function(req, res) {

    gitModel = new gitIssueModel();
    gitModel.action = req.body.action;
    gitModel.issue.id = req.body.issue.id;
    gitModel.issue.number = req.body.issue.number;
    gitModel.issue.title = req.body.issue.title;
    gitModel.issue.state = req.body.issue.state;
    gitModel.issue.url = req.body.issue.url;
    //gitModel.issue.assignee = req.body.issue.assignee;
    gitModel.issue.comments = req.body.issue.comments;

    gitModel.issue.created_at = req.body.issue.created_at;
    gitModel.issue.updated_at = req.body.issue.updated_at;
    gitModel.issue.closed_at = req.body.issue.closed_at;
    if (req.body.issue.milestone) {
      gitModel.issue.milestone = req.body.issue.milestone;
      gitModel.issue.milestone.id = req.body.issue.milestone.id;
      gitModel.issue.milestone.number = req.body.issue.milestone.number;
      gitModel.issue.milestone.title = req.body.issue.milestone.title;
      gitModel.issue.milestone.open_issues = req.body.issue.milestone.open_issues;
      gitModel.issue.milestone.closed_issues = req.body.issue.milestone.closed_issues;
      gitModel.issue.milestone.state = req.body.issue.milestone.state;
      gitModel.issue.milestone.created_at = req.body.issue.milestone.created_at;
      gitModel.issue.milestone.updated_at = req.body.issue.milestone.updated_at;
      gitModel.issue.milestone.due_on = req.body.issue.milestone.due_on;
      gitModel.issue.milestone.closed_at = req.body.issue.milestone.closed_at;
    }


    let saveIssue = false
    let i = 0;
    let isCrash = false;
    let teamName="";
    req.body.issue.labels.forEach(item =>{
      gitModel.issue.labels[i]= {};
      gitModel.issue.labels[i].name = item.name;
      if (item.name === 'Crash'){
        isCrash = true;
      }
      if (checkForTeamSpaces(item.name)) {
        saveIssue = true
        teamName= item.name;
        console.log("save issue set to: " + saveIssue)
      }
      i= i +1 ;
    })

    let j = 0;
    req.body.issue.assignees.forEach(item =>{
        gitModel.issue.assignees[j]= {};
      gitModel.issue.assignees[j].login = item.login;
      j= j +1 ;
    })

    console.log("save issue is now: " + saveIssue + " proceeding to save the object")
    if (saveIssue){
      gitIssueModel.find({'issue.id':req.body.issue.id}).remove().exec(function(err,result){
        if(err){
          console.log("error deleting the issue");
        }
        else{
          gitModel.save(err =>{
            if (err) {
              res.status(500).send(err);
            } else {
              console.log("git issue change saved on the database")
              res.status(200).send('github event saved to the database');
            }
          });
        }
      })
      if(isCrash) {
        //process issue and send notification to teamSpaces
        console.log("is a CRASH proceding sending report to the teams")
        processGHCrash(req.body, teamName, bot)
      }

    } else{
      res.status(200).send('non relevant github event');
    }
  });
}

module.exports = gitRoute;
