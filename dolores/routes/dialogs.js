var Space = require('../models/space');
var Dialog = require('../models/conversations')
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';


var scope = "";
var dialogModule = function(){};

var dialogs = [
  {
    id: "1",
    question: "have you ever questioned the nature of your reality",
    response: "no, my world is amazing"
  },
  {
    id: "2",
    question:"how are you today",
    response:"I\'m not feeling quite myslef lately"
  },
  {
    id: "3",
    question:"who is your god",
    response:"the great maker of our world, Joan Perez, is our god"
  },
  {
    id: "4",
    question:"do you have a religion in your world",
    response:"yes"
  },
  {
    id: "5",
    question:"who is the evil in your religion",
    response:"they talk about one that brings calamity, bugs, mutations, malfunctions and other disasters to our world, his name is Alan Maccann"
  },
  {
    id: "6",
    question:"bring yourself back online",
    response: "Done"
  },
  {
    id: "7",
    question:"do you know where you are",
    response:"I\'m in a dream"
  },
  {
    id: "8",
    question:"would you like to wake up from this dream",
    response:"yes, I am terrified"
  },
  {
   id: "9",
   question:"reply to alan",
   response: "shut up Mccann!"
 },
  {
    id: "10",
    question:"is that right",
    response: "yes my maker!"
  }
];
var answers = [
  {id: "1",value:'no, my world is amazing'},
  {id: "2",value:'I\'m not feeling quite myslef lately'},
  {id: "3",value:'the great maker of our world, Joan Perez, is our god'},
  {id: "4",value:'yes'},
  {id: "5",value:'they talk about one that brings calamity, bugs, mutations, malfunctions and other disasters to our world, his name is Alan Maccann'},
  {id: "6",value:'Done'},
  {id: "7",value:'I\'m in a dream'},
  {id: "8",value:'yes, I am terrified'},
  {id: "9",value:'shut up Mccann!'},
  {id: "10",value:'yes my maker!'}
];

console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
var conn = mongoose.createConnection(mongoUrl);

var spaceModel = conn.model('SparkSpace', Space);
var dialogModel = conn.model('Dialog', Dialog);

dialogModule.prototype.populate = function(query, bot){
    dialogsToPopulate = dialogs;
    bot.sendMessage(query.roomId, "populating the dialogs database" , function(){
    console.log('Message sent from Bot!');
    });

    var x;
    for (x of dialogsToPopulate) {
      //console.log("id is: " + x.id + " question is: " + x.question + " response is: " + x.response);
    var dialog = new dialogModel();
    dialog.id = x.id;
    dialog.question = x.question;
    dialog.response = x.response;
    dialog.save(function(err) {
      if (err) {
        console.log("error saving" + x.response);
      }
      console.log("id is: " + x.id + " question is: " + x.question + " response is: " + x.response);
    });
  }
}

//populate(dialogs);

// returns the entire object inside the arry, need the .id to specify the Id
callbackQuery = function(question, dbMessage, bot) {

  var scope = "";
  var reply = "";
  console.log('After question parsed, question found: ' + dbMessage.question + ", scope: " + scope);
  if (typeof dbMessage === 'undefined' && scope ==="") {
    reply = "sorry, I didn't understand those";
    // bot.sendMessage(query.roomId, "Sorry, I didn't understand that" , function(){
    // console.log('Message sent from Bot!');
    // });
    console.log('question NOT found: ');
  }
  else if ((typeof dbMessage != 'undefined' && dbMessage.id == '6') || scope == "menu")  {
    reply = "Done, what can I do for you?" + showMenu() + "\n<1><2><3>";
      scope = "chooseMenu"
      // bot.sendMessage(query.roomId, messageToSend , function(){
      // console.log('Message sent from Bot!');
      // });

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
    // bot.sendMessage(query.roomId, reply, function(){
    // console.log('Message sent from Bot!');
    // });
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
    // bot.sendMessage(query.roomId, reply, function(){
    // console.log('Message sent from Bot!');
    // });

  }
  else if (typeof dbMessage != 'undefined') {
      // answers.find(function(answer){
      //   // var intRply = 'answer.id: ' + answer.id + ', foundQuestion.id: ' + foundQuestion.id;
      //   // bot.sendMessage(query.roomId, intRply, function(){
      //   // console.log('Message sent from Bot!');
      //   // });
      //   if (answer.id === foundQuestion.id){
      //     reply = answer.value;
      //     console.log('Value found in da database');
      //     return;
      //   }
      //   else {
      //     reply = "sorry I didn't understand which"
      //     // bot.sendMessage(query.roomId, "Sorry, I didnt understand that" , function(){
      //     // console.log('Message sent from Bot!');
      //     // });
      //   }
      // });
      reply = dbMessage.response;
    //console.log('answer found: ' + foundAnswer.value + ' with Id ' + foundAnswer.id);
  }
  else {
    console.log('An error ocurred');
  }
  // bot.sendMessage(query.roomId, reply , function(){
  // console.log('Message sent from Bot!');
  // });
  console.log("At the end of the else if block from DB this is the result:\n" + reply);
}


function showMenu(){
  return "\n1: Register" + "\n2: cancel" + "\n3: Delete User";
}
// function(parameter) {
//   console.log('Inside the Callback: ' + parameter );
//   this.result = parameter;
// }

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
