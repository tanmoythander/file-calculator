var mongoose = require('mongoose');
var validate = require('./../components/validate');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var bannerSchema = new mongoose.Schema({
	header: {
		type: String,
		required: true,
		minlength: 4,
		maxlength: 200
	},
	title: {
		type: String,
		required: true,
		minlength: 7,
		maxlength: 500
	},
	description: {
		type: String,
		required: true,
		minlength: 20,
		maxlength: 5000
	},
	imageURL: {
		type: String,
		validate: validate.secureURL
	},
	bannerType: {
		type: String,
		required: true,
		enum: ['Promotion', 'News']
	},
	expiresAt: {
		type: Number,
		required: true,
		default: 0
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
			enum: ['Admin', 'SuperAdmin'],
			default: 'Admin'
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
				enum: ['Admin', 'SuperAdmin', 'System'],
				default: 'Admin'
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
mongoose.model('Banner', bannerSchema);
