var mongoose = require('mongoose');

var splunkSchema = mongoose.Schema({
	alertDate: String,
	 result:
		{ count: String },
	  app: String,
	  results_link: String,
	  owner: String,
	  search_name: String,
	  sid: String

});

splunkSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

module.exports = mongoose.model('Splunk', splunkSchema);
