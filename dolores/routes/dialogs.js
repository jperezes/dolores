var Space = require('../models/space');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';


var scope = "";
var dialogModule = function(){};

var questions = [
  {id: 1, value: 'have you ever questioned the nature of your reality'},
  {id: 2,value:'how are you today'},
  {id: 3,value:'who is your god'},
  {id: 4,value:'do you have a religion in your world'},
  {id: 5,value:'who is the evil in your religion'},
  {id: 6,value:'bring yourself back online'},
  {id: 7,value:'do you know where you are'},
  {id: 8,value:'would you like to wake up from this dream'},
  {id: 9,value:'reply to alan'},
  {id: 10,value:'is that right'}
];
var answers = [
  {id: 1,value:'no, my world is amazing'},
  {id: 2,value:'I\'m not feeling quite myslef lately'},
  {id: 3,value:'the great maker of our world, Joan Perez, is our god'},
  {id: 4,value:'yes'},
  {id: 5,value:'they talk about one that brings calamity, bugs, mutations, malfunctions and other disasters to our world, his name is Alan Maccann'},
  {id: 6,value:'Done'},
  {id: 7,value:'I\'m in a dream'},
  {id: 8,value:'yes, I am terrified'},
  {id: 9,value:'shut up Mccann!'},
  {id: 10,value:'yes my maker!'}
];



console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
mongoose.createConnection(mongoUrl);

var space = new Space();
// returns the entire object inside the arry, need the .id to specify the Id
dialogModule.prototype.response = function(query, bot) {

  console.log('About to parse and incoming message. ');
  foundQuestion = questions.find(function(question){
    var questionClean = query.message.toLowerCase();
    questionClean = questionClean.replace(" dolores","").replace("dolores ","").replace("?","");

    if (questionClean.indexOf(question.value) > -1){
      console.log('Question Found!!: ' + question.value + ' Question cleaned ' + ' with ID: ' + question.id);
      return question;
    }
  });

  console.log('After question parsed, question found: ' + foundQuestion + ", scope: " + scope);
  if (typeof foundQuestion === 'undefined' && scope ==="") {
    bot.sendMessage(query.roomId, "Sorry, I didn't understand that" , function(){
    console.log('Message sent from Bot!');
    });
    console.log('question NOT found: ');
  } else if ((typeof foundQuestion != 'undefined' && foundQuestion.id == '6') || scope == "menu") {
    var messageToSend = "Done, what can I do for you?" + showMenu() + "\n<1><2><3>";
      scope = "chooseMenu"
      bot.sendMessage(query.roomId, messageToSend , function(){
      console.log('Message sent from Bot!');
      });

  } else if (scope === "chooseMenu") {
    console.log('inside menu options about to be switched to the option!!!');
    switch (query.message) {
      case "1": //Register
        registerSpace(query);
        var reply = "is that ok? <yes/no>\n" + JSON.stringify(space);
        scope = "confirmRegistration";
        break;
      case "2": //cancel
        scope = "";
        var reply = "Goodbye!";
        break;
      case "3": //Delete
        deleteSpace();
        var reply = "User deleted, we'll miss ye";
        break;
    }
    bot.sendMessage(query.roomId, reply, function(){
    console.log('Message sent from Bot!');
    });
  } else if (scope === "confirmRegistration") {
    var reply = "";
    switch (query.message) {
      case "yes": //Register
        scope.save(function(err) {
          if (err) {
            console.log('Error saving the message');
            reply = 'Error saving the message';
          } else {
            reply = 'User saved to the DB, welcome!';
          }
        });
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
    bot.sendMessage(query.roomId, reply, function(){
    console.log('Message sent from Bot!');
    });

  } else if (typeof foundQuestion != 'undefined') {
      answers.find(function(answer){
        if (answer.id === foundQuestion.id){
          bot.sendMessage(query.roomId, answer.value , function(){
          console.log('Message sent from Bot!');
          });
        }
        else {
          bot.sendMessage(query.roomId, "Sorry, I didnt understand that" , function(){
          console.log('Message sent from Bot!');
          });
        }
      });
    //console.log('answer found: ' + foundAnswer.value + ' with Id ' + foundAnswer.id);
  } else {
    console.log('An error ocurred');
  }
}


function showMenu(){
  return "\n1: Register" + "\n2: cancel" + "\n3: Delete User";
}

function registerSpace(){
  console.log(JSON.stringify(space));
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

module.exports = dialogModule;
// module.exports = {
//   answers: answers,
//   questions: questions,
//   updateTempSpace: updateTempSpace,
//   dialogModule: dialogModule
// }
