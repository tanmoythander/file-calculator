var mongoose = require('mongoose');
var validate = require('./../components/validate');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var adminSchema = new mongoose.Schema({
	fullname: {
		type: String,
		required: true,
		maxlength: 100
	},
	email: {
		type: String,
		required: true,
		validate: validate.email
	},
	emailVerified: {
		type: Boolean,
		required: true,
		default: false
	},
	password: {
		type: String,
		required: true,
		default: 'NOT_SET'
	},
	department: {
		type: String,
		required: true
	},
	designation: {
		type: String,
		required: true
	},
	roles: [
		{
			collectionName: {
				type: String,
				required: true
			},
			access: {
				type: String,
				required: true,
				enum: ['r', 'rw'],
				default: 'r'
			}
		}
	],
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
			enum: ['Admin', 'SuperAdmin'],
			default: 'SuperAdmin'
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
				enum: ['Admin', 'SuperAdmin'],
				default: 'Admin'
			},
			log_id: {
				type: String,
				required: true
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
mongoose.model('Admin', adminSchema);
