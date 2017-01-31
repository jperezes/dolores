
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

var Space = require('./models/space');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var mongoUrl = process.env.MONGO_SPACES_URL || 'mongodb://localhost:27017/spaces';

var space = new Space();
var scope = "test";

var dialog = function(){};

console.log(' Attempting to connect to the database ');
//To avoid promise warning
mongoose.Promise = global.Promise;
// Connect to DB
mongoose.createConnection(mongoUrl);


// returns the entire object inside the arry, need the .id to specify the Id
dialog.prototype.response = function(query, bot){
  foundQuestion = questions.find(function(question){
    var questionClean = query.message.toLowerCase();
    questionClean = questionClean.replace(" dolores","").replace("dolores ","").replace("?","");

    if (questionClean.indexOf(question.value) > -1){
      console.log('Question Found!!: ' + question.value + ' Question cleaned ' + ' with ID: ' + question.id);
      return question;
    }
  });

  if (typeof foundQuestion === 'undefined') {
    return "sorry, I didn't understand that";
    console.log('question NOT found: ');
  } else if (foundQuestion.id == '6' || scope == "menu") {
    var messageToSend = "Done, what can I do for you?" + showMenu() + "\n<1><2><3>";
    scope = "chooseMenu"
      bot.sendMessage(query.roomId, messageToSend , function(){
      console.log('Message sent from Bot!');
      });

  } else if (scope === "chooseMenu") {
    switch (query.message) {
      case "1": //Register
        registerSpace(query);
        break;
      case "2": //cancel
        scope = "";
        break;
      case "3": //Delete
        deleteSpace();
        break;
    }
  } else if (scope === "delete") {

  }
  else {
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
  }
}


function showMenu(){
  return "\n1: Register" + "\n2: cancel" + "\n3: Delete User";
}

function registerSpace(){
  console.log(JSON.stringify(space));
}

function registerSpace(){
  space.roomId = tempSpace.roomId;
  space.roomType = tempSpace.roomType;
  space.personId = tempSpace.personId;
  space.personName = tempSpace.personName;
  space.personEmail = tempSpace.personEmail;
  space.nickName = tempSpace.nickName;

}

var updateTempSpace = function(space, tempSpace){
    space.roomId = tempSpace.roomId;
    space.roomType = tempSpace.roomType;
    space.personId = tempSpace.personId;
    space.personName = tempSpace.personName;
    space.personEmail = tempSpace.personEmail;
    space.nickName = tempSpace.nickName;
}



module.exports = {
  answers: answers,
  questions: questions,
  updateTempSpace: updateTempSpace,
  dialog: dialog
}
