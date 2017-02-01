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
  this.find({question: cleanQuestion}).exec(function(err, result) {
    if (err) {
      console.log('Error retrieving the dialog from the DB');
    }
    callback(question, result[0], bot);
  });
}

// // Method to find the converstions even if there are minor typos
// foundQuestion = questions.find(function(question){
//   var questionClean = query.message.toLowerCase();
//   questionClean = questionClean.replace(" dolores","").replace("dolores ","").replace("?","");
//
//   if (questionClean.indexOf(question.value) > -1){
//     console.log('Question Found!!: ' + question.value + ' Question cleaned ' + ' with ID: ' + question.id);
//     return question;
//   }
// });

// module.exports = mongoose.model('Dialog', DialogSchema);
module.exports = DialogSchema;
