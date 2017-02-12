
var expect = require('expect.js');
var express = require('express');
var port = 1337; // this needs to be centralised in an index.js test as more tests are living together
var fabricModule = require('../routes/fabricreports');
var bodyParser = require('body-parser');
var superagent = require('superagent');
var macReports = new fabricModule();

var app = express();
app.listen(port);
// TODO: finish the simple tests, specify expect result, do the call to superagent with the post and check with expect it is correct.
// before the test: before, specify bot callback function that is the one who will receive the err and the result

var request = {
  "event": "issue_impact_change",
  "payload_type": "issue",
  "payload": {
    "display_id": 123 ,
    "title": "whiteboard" ,
    "method": "whiteboard nonInthere random undiavi una vaca",
    "impact_level": 2,
    "crashes_count": 54,
    "impacted_devices_count": 16,
    "url": "http://crashlytics.com/full/url/to/issue"
  }
}

// the result obtained from the callback bot, it represents the bot messages to send
var result = {
    reportDate: "",
    roomId:"", // this is not in the real fabric report but necessary to get the roomID in the other tests
    event: "",
    payload_type: "",
    payload: {
      display_id: "" ,
      title: "",
      method: "",
      impact_level: "",
      crashes_count: "",
      impacted_devices_count: "",
      url: ""
    }
  };

var expectedResult = "Mac crash received: " +
                  //"\nevent: " + req.body.event +
                  //"\npayload Type: " + req.body.payload_type +
                  "\ndisplay ID: " + "123" +
                  "\ntitle: " + "whiteboard" +
                  "\nmethod affected: " + "whiteboard nonInthere random undiavi una vaca" +
                  "\nimpact_level: " + "2"  +
                  "\ncrashes_count: " + "54" +
                  //"\nimpacted_devices_count: " + req.body.payload.impacted_devices_count +
                  "\nurl to the crash: " + "http://crashlytics.com/full/url/to/issue";
var error = {};
var result = {message:""};
var testBot = {};
testBot = {
  roomId:"nada",
  sendMessage: function(roomId,message,callback){
    roomId = roomId;
    result.message = message;
    console.log("MESSAGE RECEIVED: " + message);
  }
}

var testBot = function(err, res,callback){
   this.err = err;
   this.result = res;
 }

describe('server', function() {

	before(function() {
    macReports.listenForMacReports(testBot,app);
	});

	after(function() {
	});

	describe('Test posts requests from fabric', function() {
    it('Test1: should respond to POST', function(done){
      var url = 'http://localhost:1337/v1/fabricreports';
      superagent.post(url).set('Content-Type', 'application/json').send(request).end(function(err, res) {
        expect(err).to.equal(null);
        expect(res).to.exist;
        //console.log("result inside it: " + result)
        //expect(testBot.getMessage()).to.equal(expectedResult);
        expect(this.result.payload.crashes_count).to.equal(54);
        done();
      });
    });


	});

});
