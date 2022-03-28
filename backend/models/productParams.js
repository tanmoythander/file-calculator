var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var productParamSchema = new mongoose.Schema({
	paramName: {
		type: String,
		required: true
	},
	paramType: {
		type: String,
		required: true,
		enum: ['string', 'number', 'boolean', 'date', 'file'],
		default: 'string'
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
	}
});

// declare a model
mongoose.model('ProductParam', productParamSchema);
