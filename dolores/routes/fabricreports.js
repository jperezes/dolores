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
    bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, "New Mac issue received" , function(){
      console.log('Message sent from Bot!');
    });

    if (req.body.event === "verification") {
      res.status(200).send('Verified');
    }
    else {
      res.json({message: 'Verification code not understood this is what is received ', req.body });
    }
    console.log(req.body.event);

  });

}



module.exports = router;
module.exports = reports;
