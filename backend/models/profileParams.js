var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var profileParamSchema = new mongoose.Schema({
	paramName: {
		type: String,
		required: true
	},
	paramRequired: {
		type: Boolean,
		required: true,
		default: false
	},
	paramType: {
		type: String,
		required: true,
		enum: ['string', 'number', 'boolean', 'date', 'file'],
		default: 'string'
	},
	paramMin: {
		type: Number,
		default: 0
	},
	paramMax: {
		type: Number,
		default: 0
	},
	paramMinLen: {
		type: Number,
		default: 0
	},
	paramMaxLen: {
		type: Number,
		default: 0
	},
	paramEnums: [
		{
			type: String
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
				enum: ['Admin', 'SuperAdmin'],
				default: 'Admin'
			},
			log_id: {
				type: String
			}
		}
	],
	active: {
		type: Boolean,
		default: true
	}
});

// declare a model
mongoose.model('ProfileParam', profileParamSchema);
