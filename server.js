var port = process.env.PORT || 1337;
var sparklite = require("sparklite");
var botdomain = process.env.DOLORES_URL;
var sparkBot = new sparklite.SparkBot(process.env.DOLORES_KEY, port, botdomain);

var stadistics = require('./dolores/routes/stadistics');
var fabricModule = require('./dolores/routes/fabricreports');
var Dialog = require('./dolores/routes/dialogs');

var botModule = new stadistics();
var macReports = new fabricModule();
var dialogModule = new Dialog();


process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

sparkBot.printHelloWorld();

sparkBot.on('message', function (event)
{
    dialogModule.parseQuestion(event,sparkBot);

    console.log(JSON.stringify(event));
})
//console.log(dialog.answers[dialog.response('who is the evil in your religion')].value);
sparkBot.on('rooms', function (event)
{
    console.log(JSON.stringify(event));
})

sparkBot.on('memberships', function (event)
{
    console.log(JSON.stringify(event));
})

botModule.listenForStadistics(sparkBot, sparkBot.getServer());
macReports.listenForMacReports(sparkBot,sparkBot.getServer());

var dialogs = {
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
};
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
query = "nada";
dialogModule.prototype.populate = function(query, sparkBot){
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

populate(dialogs);





// dialogModule.getUser(eventual);
// dialogModule.parseQuestion(eventual,sparkBot);
//dialogModule.response("event",sparkBot);
