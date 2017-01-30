var mongoose = require('mongoose');

var macReportSchema = mongoose.Schema({
    reportDate: String,
    event: String,
    payload_type: String,
    payload: {
      display_id: Number ,
      title: String,
      method: String,
      impact_level: Number,
      crashes_count: Number,
      impacted_devices_count: Number,
      url: String
    }

});


macReportSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

module.exports = mongoose.model('MacReport', macReportSchema);
