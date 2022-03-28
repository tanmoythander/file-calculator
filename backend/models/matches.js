var mongoose = require('mongoose');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

var matchSchema = new mongoose.Schema({
	matchA: {
		user_id: {
			type: String,
			required: true
		},
		status: {
			type: String,
			enum: ['Created', 'Loaded', 'Disliked', 'Liked', 'Broken'],
			default: 'Created'
		},
		loaded: {
			dateTime: {
				type: Number
			},
			log_id: {
				type: String
			}
		},
		responded: {
			dateTime: {
				type: Number
			},
			log_id: {
				type: String
			}
		},
		broken: {
			dateTime: {
				type: Number
			},
			log_id: {
				type: String
			},
			reason: {
				type: String,
				maxlength: 500
			}
		},
		matchPercentage: {
			type: Number,
			required: true
		}
	},
	matchB: {
		user_id: {
			type: String,
			required: true
		},
		status: {
			type: String,
			enum: ['Created', 'Loaded', 'Disliked', 'Liked', 'Broken'],
			default: 'Created'
		},
		loaded: {
			dateTime: {
				type: Number
			},
			log_id: {
				type: String
			}
		},
		responded: {
			dateTime: {
				type: Number
			},
			log_id: {
				type: String
			}
		},
		broken: {
			dateTime: {
				type: Number
			},
			log_id: {
				type: String
			},
			reason: {
				type: String,
				maxlength: 500
			}
		},
		matchPercentage: {
			type: Number,
			required: true
		}
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
			enum: ['User', 'Admin', 'SuperAdmin', 'System'],
			default: 'User'
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
				type: String
			}
		}
	]
});

// declare a model
mongoose.model('Match', matchSchema);
