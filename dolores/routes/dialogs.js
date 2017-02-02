var Space = require('../models/space');
var Dialog = require('../models/conversations')
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';


var scope = "";
var dialogModule = function(){};

console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
var conn = mongoose.createConnection(mongoUrl);

var spaceModel = conn.model('SparkSpace', Space);
var dialogModel = conn.model('Dialog', Dialog);

// returns the entire object inside the arry, need the .id to specify the Id
callbackQuery = function(question, dbMessage, bot) {
  var reply = "";

  if (typeof dbMessage === 'undefined' && scope ==="") {
    reply = "sorry, I didn't understand those";
    console.log('question NOT found: ');
  }
  else if ((typeof dbMessage != 'undefined' && dbMessage.id == '6') || scope == "menu")  {
    reply = "Done, what can I do for you?" + showMenu() + "\n<1><2><3>";
      scope = "chooseMenu"
  }
  else if (scope === "chooseMenu") {  // once here we have already parsed first message
    console.log('inside menu options about to be switched to the option!!!');
    switch (question.message) {
      case "1": //Register
        //registerSpace(query);
        var reply = "is that ok? <yes/no>\n" ;//+ JSON.stringify(space)
        scope = "confirmRegistration";
        break;
      case "2": //cancel
        scope = "";
        var reply = "Goodbye!";
        break;
      case "3": //Delete
        //deleteSpace();
        var reply = "User deleted, we'll miss ye";
        break;
    }
  }
  else if (scope === "confirmRegistration") {
    var reply = "";
    switch (question.message) {
      case "yes": //Register
        // space.save(function(err) {
        //   if (err) {
        //     console.log('Error saving the message');
        //     reply = 'Error saving the message';
        //   } else {
        //     reply = 'User saved to the DB, welcome!';
        //   }
        // });
        scope = "";
        break;
      case "no": //cancel
        scope = "";
        reply = "canceling process... try again later";
        break;
      default: //Delete
        reply = "didn't understand, canelling process..";
        break;
    }

  }
  else if (typeof dbMessage != 'undefined') {
      reply = dbMessage.response;

  }
  else {
    console.log('An error ocurred');
  }
  bot.sendMessage(question.roomId, reply , function(){
  console.log('Message sent from Bot!');
  });
  console.log("At the end of the else if block from DB this is the result:\n" + reply);
}


function showMenu(){
  return "\n1: Register" + "\n2: cancel" + "\n3: Delete User";
}

dialogModule.prototype.parseQuestion = function(query, bot){
  dialogModel.retrieveResponse(query, bot, callbackQuery);
}

function registerSpace(tempSpace){
  space.roomId = tempSpace.roomId;
  space.roomType = tempSpace.roomType;
  space.personName = tempSpace.person.displayName;
  space.personEmail = tempSpace.personEmail;
  space.nickName = tempSpace.person.nickName;
}

var updateTempSpace = function(space, tempSpace){

    space.roomId = tempSpace.roomId;
    space.roomType = tempSpace.roomType;
    space.personId = tempSpace.personId;
    space.personName = tempSpace.personName;
    space.personEmail = tempSpace.personEmail;
    space.nickName = tempSpace.nickName;
}

dialogModule.prototype.getUser = function(user) {
    var userRegistered;
    console.log('attempting to find the user ' + user.personEmail+ ' in the DB');
    spaceModel.find({personEmail:user.personEmail}, function(err, space){
      if (err) {
        console.log('error retreiving from the database');
        userRegistered = false;
      } else if (space.length > 0){
        console.log('user found in the databasae ');
        userRegistered=true;
      } else {
        console.log('user not registered');
        userRegistered=false;
      }
    }).limit(1);
    return userRegistered;
}

module.exports = dialogModule;
