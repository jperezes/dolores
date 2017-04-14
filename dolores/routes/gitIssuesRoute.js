var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var Space = require('../models/space');
let GitIssue = require('../models/gitissuesModel');

var gitRoute = function(){};

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
  router.route('/githubupdate').post(function(req, res) {
    console.log("github event received saving it to the database " + JSON.stringify(req.body))
    gitModel = new GitIssue()
    gitModel.action = req.body.action;
    gitModel.issue.id = req.body.issue.id;
    gitModel.issue.labels.name = req.body.issue.labels.name;
    gitModel.issue.labels.id = req.body.issue.labels.id;
    gitModel.issue.comments = req.body.issue.comments;
    gitModel.issue.title = req.body.issue.title;
    gitModel.issue.state = req.body.issue.state;
    res.status(200).send("git update received ok");

    // gitModel.save(err =>{
    //   if (err) {
    //     res.status(500).send(err);
    //   } else {
    //     console.log("git issue change saved on the database")
    //     res.status(200).send('Splunk result successfully saved to the database');
    //   }
    // });
  });
}

module.exports = gitRoute;
