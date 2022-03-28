var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var superAdminSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	collections: [
		{
			name: {
				type: String,
				required: true
			},
			accesses: [
				{
					type: String,
					required: true
				}
			]
		}
	],
	config: {
		maintenance: {
			type: Boolean,
			required: true,
			default: true
		}
	},
	createdAt: {
		type: Number,
		required: true
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
	]
});

// declare a model
mongoose.model('SuperAdmin', superAdminSchema);
