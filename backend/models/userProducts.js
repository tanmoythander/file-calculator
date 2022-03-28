var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var userProductSchema = new mongoose.Schema({
	product_id: {
		type: String,
		required: true
	},
	user_id: {
		type: String,
		required: false
	},
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
		required: true
	},
	secondaryBanner: {
		type: String,
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
	amount: {
		type: Number,
		required: true,
		min: 10,
		default: 10
	},
	payment: {
		payment_id: {
			type: String
		},
		dateTime: {
			type: Number
		},
		method: {
			type: String
		},
		source: {
			type: String
		},
		gateway: {
			type: String
		},
		transactionId: {
			type: String
		},
		accountName: {
			type: String
		},
		accountNo: {
			type: String
		},
		log_id: {
			type: String
		}
	},
	productParams: [
		{
			param_id: {
				type: String,
				required: true
			},
			paramName: {
				type: String,
				required: true
			},
			paramValue: {
				type: String,
				required: true
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
			enum: ['Public', 'User', 'Admin', 'SuperAdmin'],
			default: 'Public'
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
				type: String,
				required: true
			}
		}
	],
	active: {
		type: Boolean,
		required: true,
		default: false
	}
});

// declare a model
mongoose.model('UserProduct', userProductSchema);
