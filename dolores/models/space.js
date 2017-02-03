var mongoose = require('mongoose');

var spaceSchema = mongoose.Schema({
    roomId: String,
    roomType: String,
    personName: String,
    personEmail: String,
    nickName: String,
    macReports: {
      receive: String ,
      tags: [String]
    },
    splunkReports: {
      receive: String
    },
    windowsReports: {
      receive: String,
      tags: [String]
    }

});


spaceSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

// module.exports = mongoose.model('SparkSpace', spaceSchema);
module.exports = spaceSchema;
