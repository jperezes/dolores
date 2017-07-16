let schedule = require('node-schedule');
let mongoGit = require('../models/gitissuesModel')
var mongoose = require('mongoose');
let Promise= require('bluebird')
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';

let con = mongoose.createConnection(mongoUrl);
let gitIssueModel = mongoose.model('GitIssue', mongoGit);

let scheduleServer = function(bot){
  schedule.scheduleJob('30 12 * * *', Promise.coroutine(function* () {
      let latest = new Date();
      let earliest = new Date(latest-24*60*60*1000)

      let tempAMessage="";
      let tempBMessage="";
      let crashOpenedMessage="";
      let crashClosedMessage="";

      let resultB = yield gitIssueModel.getOpenedIssuesByLabelNameAndDate("bug",earliest.toISOString(),latest.toISOString());
      resultB.forEach(function(item){
        console.log("opened issues Found:  " + item.issue.title)
        tempBMessage = tempBMessage + "\n\n - [" + item.issue.number + "]" + "(" + item.issue.url.replace("api/v3/repos/","") + ")" + ": " + item.issue.title;
      })

      let resultA = yield gitIssueModel.getClosedIssuesByLabelNameAndDate("bug",earliest.toISOString(),latest.toISOString());
      resultA.forEach(function(item){
        console.log("closed issues Found: " + item.issue.title)
        tempAMessage = tempAMessage + "\n\n - [" + item.issue.number + "]" + "(" + item.issue.url.replace("api/v3/repos/","") + ")" + ": " + item.issue.title;
      })

      if (tempAMessage !== "" || tempBMessage !== ""){
        let finalMessage = "Daily Proteus Issues Status:\n\n" + "Issues closed:\n" + tempAMessage + "\n\nIssues Created:\n" + tempBMessage;
        bot.sendRichTextMessage(process.env.PROTEUS_ROOM_ID,finalMessage,function(){
                 console.log("user found about to send him a message");
               })
      }
      return;
    }));
}

module.exports = scheduleServer;
