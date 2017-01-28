var mongoose = require('mongoose');

var artistSchema = mongoose.Schema({
	id: {
		type: Number,
		required: true
	},
	queryName: {
		type: String,
		required: true,
		validate: [
			function(value) {
				return value.length <=120;
			},
			'Name is too long (120 max)'
		]
	},
	description: String,
	genre: String,
	imageUrl: String,
	location: String,
	tags: String,
	categoryId: Number
});


artistSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

module.exports = mongoose.model('Artist', artistSchema);
