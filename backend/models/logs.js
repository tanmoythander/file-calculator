var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var logSchema = new mongoose.Schema({
	action: {
		type: String,
		required: true,
		enum: ['create', 'read', 'update', 'delete']
	},
	details: {
		type: String
	},
	collectionName: {
		type: String,
		required: true
	},
	oldDoc: {
		type: String
	},
	newDoc: {
		type: String
	},
	appName: {
		type: String,
		required: true
	},
	appKey: {
		type: String,
		required: true
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
			enum: ['Public', 'User', 'Admin', 'System', 'SuperAdmin'],
			default: 'User'
		}
	}
});

// declare a model
mongoose.model('Log', logSchema);
