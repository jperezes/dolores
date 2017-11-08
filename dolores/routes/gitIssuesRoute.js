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

  let teamLabels = process.env.TEAM_LABELS.split(",");
  let validActions =["open","opened","labeled","unlabeled","reopened","closed"]

  let checkForTeamLabels = function(ghLabel){
    let check = ""
    teamLabels.forEach(item=>{
      if(ghLabel.indexOf(item) !== -1){
        console.log("Valid team found")
        check = "found"
      }
    })
    if(check === "found"){
      return true;
    } else{
      console.log("valid team not found")
      return false;
    }
  }
  let countTeamLabels = function(labels){
    count = 0;
    labels.forEach(item =>{
      if(checkForTeamLabels(item.name)) {
        count ++;
      }
    })
    return count;
  }
  let checkValidAction = function(action) {
    let isValid = false;
    validActions.forEach(item =>{
      if(action === item) {
        isValid = true;
        return;
      }
    })
    return isValid;
  }

  let checkReportedCrash

  let checkForHash = function(message) {

    var token = "hash c: "
    var tokenLength= token.length;
    var hash_sample= "c9c1e92e295e0c7bbb0efd9b267442b1";
    var hashLength= hash_sample.length
    var hashFound ="";
    var n = message.toLowerCase().indexOf(token);
    var substr = "";
    if (n !== -1) {
        //this is to be sure we get the hash
        hashFound= message.substring(n + tokenLength, n + tokenLength + hashLength);
        console.log("crash with found, id: " + hashFound);
    }
    return hashFound;
  }

  let checkForId = function(message) {

    var token = "crash id: "
    var tokenLength= token.length;
    var patt = new RegExp("[^(0-9)]");
    var idFound ="";
    var n = message.toLowerCase().indexOf(token);
    var substr = "";
    if (n !== -1) {
        //this is to be sure we get the hash
        var filterdId = message.substring(n+tokenLength , n+tokenLength + 10)
        var end = str.indexOf(patt.exec(str));
        hashFound= filteredId.substring(0, end);
        console.log("crash with found, id: " + hashFound);
    }
    return hashFound;
  }

  let getTeamRoomId = function(teamName) {
    let roomId = "";
    console.log("getting id for team name: " + teamName)
    if(teamName.indexOf(process.env.TEAM_SCRUM) !== -1) {
      roomId = process.env.ROOM_SYSTEM_ID;
    } else if(teamName.indexOf(process.env.CALL_TEAM) !== -1) {
      roomId = process.env.CALL_ROOM_ID;
    } else if(teamName.indexOf(process.env.MESSAGE_TEAM) !== -1) {
      roomId = process.env.MESSAGE_ROOM_ID;
    }else if(teamName.indexOf(process.env.MEETINGS_TEAM) !== -1) {
      roomId = process.env.MEETINGS_ROOM_ID;
    }else if(teamName.indexOf(process.env.GUILD_TEAM) !== -1) {
      roomId = process.env.GUILD_ROOM_ID;
    }else if(teamName.indexOf(process.env.RECORDING_TEAM) !== -1) {
      roomId = process.env.RECORDING_ROOM_ID;
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

      console.log("the action is: " + ghIssue.action)
      if(checkValidAction(ghIssue.action) !== true) {
        //only new reports will be sent to the teams, any other modification shall be ignored
        console.log("action not open aborting ...")
        return;
      }

      //check if issue has a Hash and it has been reported to dolores
      let hashC = checkForHash(ghIssue.issue.body);
      if ( hashC === "" ) {
        //no hash
        reply = "Hi *" + teamName + "* A GH crash has been assigned to your team:\n\n" +
                "\n\n - [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                "\n\n This crash has not yet been reported to the crash server, please add filter key word present on the stack trace " +
                "to identify it and get reports to this room *Dolores -aw <keywords>*";
      } else{
        // hash found
        let crash = yield winReportModel.getCrashByHash(hashC);
        if (ghIssue.action === "closed") {
          //about to set the issue as closed based on the current blue
          console.log("closing the issue as it has been fixed on GH")
          let result = yield winReportModel.setCrashAsFixed(crash.id,"");
          if(result) {
            reply = "Hi *" + teamName + "* A GH crash has been closed:\n\n" +
                    "\n\n > [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                    "\n\n > Reported crash id: " + crash.id;
          } else {
            reply = "error closing the crash"
          }
        }
        else if(typeof(crash.reportDate) !== 'undefined') {
          console.log("git hub crash found on the database")
          crash.assigned_team = teamName;
          alreadyOpenedGHIssue = ""
          if (typeof(crash.githubUrl) === 'undefined' || crash.githubUrl === "") {
            console.log("updating git hub crash url")
            crash.githubUrl = ghIssue.issue.url.replace("api/v3/repos/","");
          } else {
            alreadyOpenedGHIssue = "\n\n> **Important: ** this crash is associated with a different GH issue: " +
            "[" + ghIssue.issue.number + "]" + "(" +   crash.githubUrl + ")" + ". Please close duplicates";
            crash.githubUrl = ghIssue.issue.url;
          }
          reply = "Hi *" + teamName + "* A GH crash issue has been assigned to your team:\n\n" +
                  "\n\n > [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                  "\n\n > Reported crash id: " + crash.id +
                  "\n\n > Last occurrence: " + crash.reportDate.slice(-1).pop() +
                  alreadyOpenedGHIssue +
                  "\n\n > Type Dolores -i " + crash.id + " for more info";
          crash.save(function(err){
            if(err) {
              console.log("error saving the crash")
            }
          });
        }
        else {
            console.log("git hub crash found on the database but report date is null")
          //crash not yet reported
          reply = "Hi *" + teamName + "* A GH crash has been assigned to your team:\n\n" +
                  "\n\n - [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                  "\n\n This crash has not yet been reported to Dolores, adding the hash to the filter so further reports will be sent to this space ";
        }
      }
      //send it to the team
      bot.sendRichTextMessage(process.env.JUAN_DOLORES_ROOM_ID/*room_id*/,reply,function(){
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
      let name = item.name;
      gitModel.issue.labels[i]= {};
      gitModel.issue.labels[i].name = name;
      if (name === 'Crash'){
        isCrash = true;
      }
      if (checkForTeamLabels(name)) {
        saveIssue = true
        teamName= name;
      }
      i= i +1 ;
    })

    let j = 0;
    req.body.issue.assignees.forEach(item =>{
        gitModel.issue.assignees[j]= {};
      gitModel.issue.assignees[j].login = item.login;
      j= j +1 ;
    })

    if(isCrash) {
      //don't multi labeled crashes duplicate crashes
      if(countTeamLabels(req.body.issue.labels) > 1) {
        console.log("crash assigned to multiple teams, not saving ...")
        saveIssue = false;
      }
    }

    console.log("save issue is now: " + saveIssue + " proceeding to save the object")
    if (saveIssue){
      gitIssueModel.findOneAndRemove({'issue.id':req.body.issue.id},function(err,result){
        if(err){
          console.log("error deleting the issue");
        }
        else{
          let teamChanged = false;
          //check if the unlabel is the team, otherwise don't care
          if(result && typeof(result.issue.labels !== 'undefined') && (req.body.action==="unlabeled" || req.body.action==="labeled"))
          {
            console.log("git issue present on the database already")
            result.issue.labels.forEach(item=>{
              if(checkForTeamLabels(item.name)){
                if(item.name !== teamName)
                {
                  console.log("team changed proceding to send message")
                  teamChanged = true;
                }
              }
            })
            if(!teamChanged)
            {
              console.log("reseting the action")
              req.body.action = " - ";
            }
          }
          //check if team label has been added, if so, remove the old one.
          //if the label is
          gitModel.save(err =>{
            if (err) {
              res.status(500).send(err);
            } else {
              console.log("git issue change saved on the database")
              res.status(200).send('github event saved to the database');
            }
          });
        }
      }).then(function(){
        if(isCrash) {
          //process issue and send notification to teamSpaces
          console.log("is a CRASH proceding sending report to the teams")
          processGHCrash(req.body, teamName, bot)
        }
      })
    } else{
      res.status(200).send('non relevant github event');
    }
  });
}

module.exports = gitRoute;
