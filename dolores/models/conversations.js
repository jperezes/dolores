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

DialogSchema.statics.populate = function(dialog, bot){

    // bot.sendMessage(query.roomId, "populating the dialogs database" , function(){
    // console.log('Message sent from Bot!');
    // });

    dialog.save(function(err) {
      if (err) {
        console.log("error saving" + x.response);
      }
      console.log("saving user to the database");
    });

}

//populate(dialogs);



// module.exports = mongoose.model('Dialog', DialogSchema);
module.exports = DialogSchema;
