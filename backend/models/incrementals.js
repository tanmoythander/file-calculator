var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var incrementalSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	value: {
		type: Number,
		required: true,
		default: 1
	},
	prefixValue: {
		type: String,
		required: true
	},
	year: {
		type: Number
	},
	branchCode: {
		type: String
	},
	productCode: {
		type: String
	},
	productType: {
		type: String
	}
});

// declare a model
mongoose.model('Incremental', incrementalSchema);
