let schedule = require('node-schedule');
let mongoGit = require('../models/gitissuesModel')
var mongoose = require('mongoose');
let Promise= require('bluebird')

let con = mongoose.createConnection(process.env.MONGO_SPACES_URL);
let gitIssueModel = mongoose.model('GitIssue', mongoGit);

let scheduleServer = function(bot){
  schedule.scheduleJob('25 18 * * *', Promise.coroutine(function* () {
      let latest = new Date();
      let earliest = new Date(latest-24*60*60*1000)

      let tempAMessage="Issues closed:\n";
      let tempBMessage="\n\nIssues Created:\n";

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
      let finalMessage = "Daily Proteus Issues Status:\n\n" + tempAMessage + tempBMessage;
      bot.sendRichTextMessage(process.env.JUAN_DOLORES_ROOM_ID,finalMessage,function(){
               console.log("user found about to send him a message");
             })
      return;
    }));
}

module.exports = scheduleServer;
