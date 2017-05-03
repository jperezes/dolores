let schedule = require('node-schedule');
let mongoGit = require('../models/gitissuesModel')
var mongoose = require('mongoose');
let Promise= require('bluebird')

let con = mongoose.createConnection(process.env.MONGO_SPACES_URL);
let gitIssueModel = mongoose.model('GitIssue', mongoGit);

let scheduleServer = function(bot){
  schedule.scheduleJob('42 * * * * *', Promise.coroutine(function* () {
      let latest = new Date();
      let earliest = new Date(latest-24*60*60*1000)

      let tempAMessage="Closed issues last 24h:\n";
      let tempBMessage="Opened issues last 24h:\n";
      let resultA = yield gitIssueModel.getClosedIssuesByLabelNameAndDate("bug",earliest.toISOString(),latest.toISOString());
      resultA.forEach(function(item){
        console.log("result Found: " + item.issue.title)
        tempAMessage = tempAMessage + "\n\n - [" + item.issue.number + "]" + "(" + item.issue.url + ")" + ": " + item.issue.title;
      })
      let resultB = yield gitIssueModel.getOpenedIssuesByLabelNameAndDate("bug",earliest.toISOString(),latest.toISOString());
      resultB.forEach(function(item){
        console.log("result Found: " + item.issue.title)
        tempBMessage = tempBMessage + "\n\n - [" + item.issue.number + "]" + "(" + item.issue.url + ")" + ": " + item.issue.title;
      })


      let finalMessage = tempAMessage + tempBMessage;
      bot.sendRichTextMessage(process.env.JUAN_DOLORES_ROOM_ID,finalMessage,function(){
               console.log("user found about to send him a message");
             })
      return;
    }));
}

module.exports = scheduleServer;
