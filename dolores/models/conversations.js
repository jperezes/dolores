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

// module.exports = mongoose.model('Dialog', DialogSchema);
module.exports = DialogSchema;
