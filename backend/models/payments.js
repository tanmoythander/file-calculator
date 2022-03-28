var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var paymentSchema = new mongoose.Schema({
	user_id: {
		type: String,
		required: false
	},
	userProduct_id: {
		type: String,
		required: true
	},
	storeName: {
		type: String,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	store_amount: {
		type: Number
	},
	tran_date: {
		type: Number
	},
	val_id: {
		type: String
	},
	card_type: {
		type: String
	},
	card_no: {
		type: String
	},
	currency: {
		type: String
	},
	bank_tran_id: {
		type: String
	},
	card_issuer: {
		type: String
	},
	card_brand: {
		type: String
	},
	card_issuer_country: {
		type: String
	},
	card_issuer_country_code: {
		type: String
	},
	appName: {
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
			enum: ['Public', 'User', 'Admin', 'SuperAdmin', 'System'],
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
	expiresAt: {
		type: Number,
		default: 0
	},
	active: {
		type: Boolean,
		required: true,
		default: true
	}
});

// declare a model
mongoose.model('Payment', paymentSchema);
