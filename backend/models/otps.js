var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

// var expiryMin = 5;

var otpSchema = new mongoose.Schema({
	otp: {
		type: String,
		required: true
	},
	mobileNo: {
		type: String
	},
	member_id: {
		type: String
	},
	createdAt: {
		type: Number,
		required: true
	},
	expiresAt: {
		type: Number,
		required: true
	},
	active: {
		type: Boolean,
		required: true,
		default: true
	},
	verified: {
		type: Boolean,
		required: true,
		default: false
	},
	verifiedAt: {
		type: Number
	}
});

/*
otpSchema.pre('save', function(next) {
	this.expiresAt = this.get('createdAt') + expiryMin*60*1000;
	next();
});
*/

// declare a model
mongoose.model('OTP', otpSchema);
