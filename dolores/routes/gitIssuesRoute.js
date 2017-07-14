var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Space = require('../models/space');
let GitIssueSchema = require('../models/gitissuesModel');

var gitRoute = function(){};
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
    req.body.issue.labels.forEach(item =>{
      gitModel.issue.labels[i]= {};
      gitModel.issue.labels[i].name = item.name;
      if (item.name === process.env.TEAM_SCRUM) {
        saveIssue = true
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

    } else{
      res.status(200).send('invalid github event');
    }
  });
}

module.exports = gitRoute;
