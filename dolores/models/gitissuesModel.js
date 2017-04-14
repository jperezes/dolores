var mongoose = require('mongoose');

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
    "labels": [
      {
        "id": Number,
        "url": String,
        "name": String,
        "color": String,
        "default": Boolean
      }
    ],
    "state": String,
    "locked": Boolean,
    "assignee": String,
    "milestone": String,
    "comments": String,
    "created_at": String,
    "updated_at": String,
    "closed_at": String,
    "body": String
  }
});


gitIssueSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

module.exports = mongoose.model('GitIssue', gitIssueSchema);
