var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var conversationSchema = new mongoose.Schema({
	match_id: {
		type: String
	},
	user_ids: [{
		type: String
	}],
	messages: [{
		text: {
			type: String,
			required: true,
			minlength: 1
		},
		// TODO: add more message types like file, image, video, audio etc
		sent: {
			dateTime: {
				type: Number,
				required: true
			},
			user_id: {
				type: String,
				required: true
			},
			log_id: {
				type: String,
				required: true
			}
		},
		receivedAt: {
			type: Number
		},
		seenAt: {
			type: Number
		}
	}],
	created: {
		dateTime: {
			type: Number,
			required: true
		},
		member_id: {
			type: String,
			required: true
		},
		memberType: {
			type: String,
			required: true,
			enum: ['User', 'Admin', 'SuperAdmin', 'System'],
			default: 'User'
		},
		log_id: {
			type: String
		}
	},
	updates: [
		{
			dateTime: {
				type: Number,
				required: true
			},
			member_id: {
				type: String,
				required: true
			},
			memberType: {
				type: String,
				required: true,
				enum: ['User', 'Admin', 'SuperAdmin', 'System'],
				default: 'User'
			},
			log_id: {
				type: String
			}
		}
	]
});

conversationSchema.path('user_ids')
	.validate(function(user_ids) {
		if (!user_ids) {
			return false;
		}
		else if (user_ids.length !== 2) {
			return false;
		}
		return true;
	}, 'Conversation requires both user\'s id');

// declare a model
mongoose.model('Conversation', conversationSchema);
