var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');


var reports = function(){};

reports.prototype.listenForMacReports = function(bot,app){
  this.app = app;
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(bodyParser.json());
  this.app.use('/v1',router);
  router.use(function(req, res, next) {
    console.log('FYI...There is some processing currently going down...');

    // console.log('and it is very weird: ',req);
    next();
  });
  router.route('/fabricreports').post(function(req, res) {

    var event = req.body.event;
    var payloadType = req.body.payload_type;
    var displayId = req.body.payload.display_id;
    var title = req.body.payload.title;
    var methodName = req.body.payload.method;

    var failureReport = "failure received event: " + event +
                        "\npayload Type: " + req.body.payload_type +
                        "\ndisplay ID: " + req.body.payload.display_id +
                        "\ntitle: " + req.body.payload.title +
                        "\nmethod affected: " + req.body.payload.method +
                        "\nimpact_level: " + req.body.payload.impact_level  +
                        "\ncrashes_count: " + req.body.payload.crashes_count +
                        "\nimpacted_devices_count: " + req.body.payload.impacted_devices_count +
                        "\nurl to the crash: " + req.body.payload.url;

    if (req.body.event === "verification") {
      res.status(200).send('Verified');
    }
    else {
      bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, failureReport , function(){
        console.log('Message sent from Bot!');
      });
    }
    console.log(failureReport);

  });

}



module.exports = router;
module.exports = reports;
