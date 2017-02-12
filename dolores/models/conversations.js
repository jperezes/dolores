var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DialogSchema = new Schema({
  id: String,
  question: String,
  response: String
});

DialogSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

 // static method to retrieve the response given a question
DialogSchema.statics.retrieveResponse = function (question, bot, callback) {
  var cleanQuestion = question.message.toLowerCase().replace(" dolores","").replace("dolores ","").replace("?","");
  console.log('question cleaned : ' + cleanQuestion);
  this.find({question: cleanQuestion}).lean().exec(function(err, result) {
    if (err) {
      console.log('Error retrieving the dialog from the DB');
    }
    console.log('question properly parsed, response: ' + result[0]);
    callback(question, result[0], bot);
  });
}


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

dialogModule.statics.populate = function(query, bot){
    dialogsToPopulate = dialogs;
    bot.sendMessage(query.roomId, "populating the dialogs database" , function(){
    console.log('Message sent from Bot!');
    });

    var x;
    for (x of dialogsToPopulate) {
      //console.log("id is: " + x.id + " question is: " + x.question + " response is: " + x.response);
    //var dialog = new dialogModel();
    this.id = x.id;
    this.question = x.question;
    this.response = x.response;
    this.save(function(err) {
      if (err) {
        console.log("error saving" + x.response);
      }
      console.log("id is: " + x.id + " question is: " + x.question + " response is: " + x.response);
    });
  }
}

//populate(dialogs);


// module.exports = mongoose.model('Dialog', DialogSchema);
module.exports = DialogSchema;
