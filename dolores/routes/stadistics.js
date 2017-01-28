var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');


var botModule = function(){};
var botSpark;
var messageTest;
botModule.prototype.setBot = function(bot, message){
  botSpark = bot;
  this.messageTest = message;
}

botModule.prototype.listenForStadistics = function(bot,app){
  this.app = app;
  this.app.use(bodyParser.urlencoded({extended: true}));
  this.app.use(bodyParser.json());
  this.app.use('/v1',router);
  router.use(function(req, res, next) {
    console.log('FYI...There is some processing currently going down...');

    // console.log('and it is very weird: ',req);
    next();
  });
  router.route('/stadistics').post(function(req, res) {
    bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, "I have received a post message" , function(){
      console.log('Message sent from Bot!');
    });

    if (req.event === "verification") {
      res.status(200).send('Verified');
    }
    else {
      res.json({message: 'Verification code not understood this is what is received ' + req });
    }
    console.log('POST RECEIVED !!!');

  });

  console.log('lets see what is this message ' + messageTest);

  router.route('/stadistics').get(function(req, res) {
    bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, "I have received a get message" , function(){
      console.log('Message sent from Bot!');
    });
      res.json({message: 'Welcome to our API from get!'});
      //res.status(200).send('Found');
    //  res.json({message: 'Vehicle was successfully manufactured'});
  });

  // Print friendly message to console
  //console.log('Server listening on port ' + port);
  //app.listen(port);
}



module.exports = router;
module.exports = botModule;
