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

  //let teamLabels = process.env.TEAM_LABELS.split(",");
  let validActions =["open","opened","labeled","unlabeled","reopened"]

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
        if(typeof(crash.reportDate) !== 'undefined') {
          console.log("git hub crash found on the database")
          crash.assigned_team = teamName;

          //Add the hash to the team id to get further crashes.
          console.log("adding keyword to the filter..." + hashC);
          let result = yield spaceModel.addFilterKeyWordDistinct(room_id,hashC)
          console.log(result);
          //process the reply on failure

          reply = "Hi *" + teamName + "* A GH crash has been assigned to your team:\n\n" +
                  "\n\n > [" + ghIssue.issue.number + "]" + "(" + ghIssue.issue.url.replace("api/v3/repos/","") + ")" + ": " + ghIssue.issue.title +
                  "\n\n > Reported crash id: " + crash.id +
                  "\n\n > Reported crash hash: " + crash.hashA +
                  "\n\n > First occurrence: " + crash.reportDate[0] +
                  "\n\n \nAny further occurrences of the same crash will be reported to this room, to get info about the crash type *Dolores -i crash id*";
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
          yield spaceModel.addFilterKeyWord(room_id,hashC)
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
