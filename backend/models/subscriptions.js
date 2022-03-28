var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var subscriptionSchema = new mongoose.Schema({
	product_id: {
		type: String,
		required: true
	},
	user_id: {
		type: String,
		required: true
	},
	amount: {
		type: Number,
		min: 10
	},
	notification: {
		type: Boolean,
		default: false
	},
	notificationMethod: {
		type: String,
		enum: ['SMS', 'PushNotification', 'Email'],
		default: 'SMS'
	},
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
			enum: ['User', 'Admin', 'SuperAdmin'],
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
	],
	active: {
		type: Boolean,
		required: true,
		default: true
	}
});

// declare a model
mongoose.model('Subscription', subscriptionSchema);
