var mongoose = require('mongoose');
var validate = require('./../components/validate');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var productSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		maxlength: 100
	},
	description: {
		type: String,
		default: ''
	},
	productType: {
		type: String,
		required: true
	},
	storeName: {
		type: String,
		required: true
	},
	primaryBanner: {
		type: String,
		validate: validate.secureURL,
		required: true
	},
	secondaryBanner: {
		type: String,
		validate: validate.secureURL,
		required: false
	},
	notifyIntervalDays: {
		type: Number,
		default: 0,
		min: 0,
		max: 365
	},
	amountIsFixed: {
		type: Boolean,
		required: true,
		default: false
	},
	productConfig: [
		{
			param_id: {
				type: String,
				required: true
			},
			paramName: {
				type: String,
				required: true
			},
			paramType: {
				type: String,
				required: true
			},
			paramEnums: [
				{
					type: String
				}
			],
			paramRequired: {
				type: Boolean,
				required: true,
				default: false
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
			paramValue: {
				type: String,
				default: ''
			},
			paramSource: {
				type: String,
				default: ''
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
		required: true,
		default: true
	}
});

// declare a model
mongoose.model('Product', productSchema);
