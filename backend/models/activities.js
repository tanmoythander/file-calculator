var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var activitySchema = new mongoose.Schema({
	user_id: {
		type: String,
		required: true
	},
	linkedUser_id: {
		type: String,
		required: true
	},
	icon: {
		type: String,
		required: true,
		enum: [
			'match', 'unmatch', 'on', 'off',
			'partner-preference', 'edit-profile'
		]
	},
	details: {
		type: String,
		required: true
	},
	created: {
		dateTime: {
			type: Number,
			required: true
		},
		log_id: {
			type: String,
			required: true
		}
	}
});

// declare a model
mongoose.model('Activity', activitySchema);
