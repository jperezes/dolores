var mongoose = require('mongoose');
let Promise = require('bluebird');
//mongoose.set('debug', true);

var gitIssueSchema = mongoose.Schema({
  "action": String,
  "issue": {
    "url": String,
    "labels_url": String,
    "comments_url":String,
    "events_url": String,
    "html_url": String,
    "id": Number,
    "number": Number,
    "title": String,
    "user": {
      "login": String,
      "id": Number,
      "avatar_url": String,
      "gravatar_id": "",
      "url": String,
      "html_url": String,
      "followers_url": String,
      "following_url": String,
      "gists_url": String,
      "starred_url": String,
      "subscriptions_url": String,
      "organizations_url": String,
      "repos_url": String,
      "events_url": String,
      "received_events_url": String,
      "type": String,
      "site_admin": Boolean
    },
    "labels":[{
        "name": String
      }]
    ,
    "state": String,
    "locked": Boolean,
    "assignees": [{
        "login":String
      }],
    "milestone": String,
    "comments": String,
    "created_at": String,
    "updated_at": String,
    "closed_at": String,
    "body": String,
    "milestone": {
      "id": Number,
      "number": Number,
      "title": String,
      "open_issues": Number,
      "closed_issues": Number,
      "state": String,
      "created_at": String,
      "updated_at": String,
      "due_on": String,
      "closed_at": String
    }
  }

});

gitIssueSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

gitIssueSchema.statics.getIssuesByLabelName = function(labelName){
  return new Promise((resolve,reject)=>{
    this.find({"issue.labels.name":labelName},function(err,items){
      if(err){
        console.log("first error on find" + err)
        reject(err);
      }
      else if(items){
        console.log("label found")
        resolve(items);
      }
      else {
        reject("label not found");
      }
    });
  })
}

gitIssueSchema.statics.getIssuesByLabelNameCallback = function(labelName,callback) {
  console.log("about to start finding the issues")
   this.find({action:"closed"},function(err,items){
     console.log("just printing")
     if(err){
       console.log("first error on find" + err)
     }
     else if(items){
       console.log("label found")
      items.forEach(function(item){
        callback(item)
      })
     }
     else {
       console.log("label not found");
     }
   });
}

gitIssueSchema.statics.getClosedIssuesByLabelNameAndDate = function(labelName,team, earliest,latest){
  return new Promise((resolve,reject)=>{
   console.log("about to start finding the issues")
    this.find({"issue.closed_at":{$gte: earliest,$lte: latest}, "issue.labels.name":{$all: [labelName,new RegExp(team + '$',"i")]}, "issue.state":"closed"},function(err,items){
      if(err){
        console.log("first error on find" + err)
        reject(err);
      }
      else if(items){
        console.log("GIT ISSUES FOUND")
        resolve(items);
      }
      else {
        console.log("nothing found")
        reject("label not found");
      }
    });
  })
}
gitIssueSchema.statics.getOpenedIssuesByLabelNameAndDate = function(labelName,team, earliest,latest){
  return new Promise((resolve,reject)=>{
   console.log("about to start finding the issues")
    this.find({"issue.created_at":{$gte: earliest,$lte: latest},  "issue.labels.name":{$all: [labelName,new RegExp(team + '$',"i")]}, "issue.state":"open"},function(err,items){
      if(err){
        console.log("first error on find" + err)
        reject(err);
      }
      else if(items){
        resolve(items);
      }
      else {
        console.log("nothing found")
        reject("label not found");
      }
    });
  })
}

module.exports = gitIssueSchema;
//module.exports = mongoose.model('GitIssue', gitIssueSchema);
