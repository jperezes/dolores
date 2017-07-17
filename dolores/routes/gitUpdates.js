let schedule = require('node-schedule');
let mongoGit = require('../models/gitissuesModel')
var mongoose = require('mongoose');
let Promise= require('bluebird')
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';

let con = mongoose.createConnection(mongoUrl);
let gitIssueModel = mongoose.model('GitIssue', mongoGit);
let teamSpaces= [process.env.TEAM_SCRUM,process.env.CALL_SCRUM,process.env.MESSAGE_SCRUM,process.env.PROGRAM_SCRUM];

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

let scheduleServer = function(bot){
  schedule.scheduleJob('30 12 * * *', Promise.coroutine(function* () {
      let latest = new Date();
      let earliest = new Date(latest-24*60*60*1000)

      let tempAMessage="";
      let tempBMessage="";
      let crashOpenedMessage="";
      let crashClosedMessage="";
      for(let team of teamSpaces) {

        let resultB = yield gitIssueModel.getOpenedIssuesByLabelNameAndDate("bug",team, earliest.toISOString(),latest.toISOString());
        resultB.forEach(function(item){
          console.log("opened issues Found:  " + item.issue.title)
          tempBMessage = tempBMessage + "\n\n - [" + item.issue.number + "]" + "(" + item.issue.url.replace("api/v3/repos/","") + ")" + ": " + item.issue.title;
        })

        let resultA = yield gitIssueModel.getClosedIssuesByLabelNameAndDate("bug",team, earliest.toISOString(),latest.toISOString());
        resultA.forEach(function(item){
          console.log("closed issues Found: " + item.issue.title)
          tempAMessage = tempAMessage + "\n\n - [" + item.issue.number + "]" + "(" + item.issue.url.replace("api/v3/repos/","") + ")" + ": " + item.issue.title;
        })

        if (tempAMessage !== "" || tempBMessage !== ""){
          let finalMessage = "Daily *" +  team + "* Issues Status:\n\n" + "Issues closed:\n" + tempAMessage + "\n\nIssues Created:\n" + tempBMessage;
          bot.sendRichTextMessage(getTeamRoomId(team),finalMessage,function(){
                   console.log("user found about to send him a message");
                 })
        }

      }





      return;
    }));
}

module.exports = scheduleServer;
