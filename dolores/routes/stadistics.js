var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var app = express();

var botModule = function(){};
var botSpark;
var messageTest;
botModule.prototype.setBot = function(bot, message){
  botSpark = bot;
  this.messageTest = message;
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/v1',router);

botModule.prototype.listenForStadistics = function(bot,port){


  router.use(function(req, res, next) {
    console.log('FYI...There is some processing currently going down...');

    // console.log('and it is very weird: ',req);
    next();
  });
  router.route('/stadistics').post(function(req, res) {
    // botSpark.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, "I have received a post message" , function(){
    //   console.log('Message sent from Bot!');
    // });
    res.json({message: 'Welcome to our API from post!'});
    console.log('POST RECEIVED !!!');

  });

  console.log('lets see what is this message ' + messageTest);

  router.route('/stadistics').get(function(req, res) {
    bot.sendMessage(process.env.JUAN_DOLORES_ROOM_ID, "I have received a get message" , function(){
      console.log('Message sent from Bot!');
    });
      console.log('GET RECEIVED our message is!!!');
      res.json({message: 'Welcome to our API from get!'});
      //res.status(200).send('Found');
    //  res.json({message: 'Vehicle was successfully manufactured'});
  });

  // Print friendly message to console
  console.log('Server listening on port ' + port);
  app.listen(port);
}



module.exports = router;
module.exports = botModule;
