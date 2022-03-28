var mongoose = require('mongoose');
var validate = require('./../components/validate');
// patch to support MongoDB Server v3.5+
mongoose.plugin(schema => {
	schema.options.usePushEach = true;
});

const districts = [
	'Bagerhat',
	'Bandarban',
	'Barguna',
	'Barisal',
	'Bhola',
	'Bogra',
	'Brahmanbaria',
	'Chandpur',
	'Chapainawabganj',
	'Chittagong',
	'Chuadanga',
	'Comilla',
	// eslint-disable-next-line quotes
	"Cox's Bazar",
	'Dhaka',
	'Dinajpur',
	'Faridpur',
	'Feni',
	'Gaibandha',
	'Gazipur',
	'Gopalganj',
	'Habiganj',
	'Jamalpur',
	'Jessore',
	'Jhalokati',
	'Jhenaidah',
	'Joypurhat',
	'Khagrachhari',
	'Khulna',
	'Kishoreganj',
	'Kurigram',
	'Kushtia',
	'Lakshmipur',
	'Lalmonirhat',
	'Madaripur',
	'Magura',
	'Manikganj',
	'Meherpur',
	'Moulvibazar',
	'Munshiganj',
	'Mymensingh',
	'Naogaon',
	'Narail',
	'Narayanganj',
	'Narsingdi',
	'Natore',
	'Netrokona',
	'Nilphamari',
	'Noakhali',
	'Pabna',
	'Panchagarh',
	'Patuakhali',
	'Pirojpur',
	'Rajbari',
	'Rajshahi',
	'Rangamati',
	'Rangpur',
	'Satkhira',
	'Shariatpur',
	'Sherpur',
	'Sirajganj',
	'Sunamganj',
	'Sylhet',
	'Tangail',
	'Thakurgaon'
];
const religions = ['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other'];
const relationshipStatuses = ['Single', 'Divorced', 'Widowed'];
const nationalities = ['Bangladeshi', 'Other'];
const genders = ['Male', 'Female'];
const bloodGroups = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'];

var userSchema = new mongoose.Schema({
	profile: {
		nickname: {
			type: String,
			minlength: 3,
			maxlength: 15
		},
		photos: [
			{
				filename: {
					type: String,
					required: true
				},
				destination: {
					type: String,
					required: true
				},
				url: {
					type: String,
					required: true
				},
				verified: {
					type: Boolean,
					required: true,
					default: false
				}
			}
		],
		about: {
			type: String,
			minlength: 25,
			maxlength: 3000
		},
		relationshipStatus: {
			type: String,
			enum: relationshipStatuses,
			required: true
		},
		height: {
			type: Number,
			required: true,
			min: 36,
			max: 96
		},
		weight: {
			type: Number,
			required: true,
			min: 30,
			max: 150
		},
		district: {
			type: String,
			enum: districts,
			required: true,
			minlength: 2,
			maxlength: 25
		},
		nationality: {
			type: String,
			enum: nationalities,
			required: true,
			default: nationalities[0]
		},
		education: [
			{
				degree: {
					type: String,
					minlength: 2,
					maxlength: 10,
					required: true
				},
				instituteName: {
					type: String,
					minlength: 5,
					maxlength: 100,
					required: true
				},
				department: {
					type: String,
					minlength: 3,
					maxlength: 100,
					required: true
				},
				passingYear: {
					type: Number,
					min: 1970,
					required: true
				},
				verified: {
					type: Boolean,
					default: false
				}
			}
		],
		work: [
			{
				workplaceName: {
					type: String,
					minlength: 5,
					maxlength: 100,
					required: true
				},
				address: {
					type: String,
					minlength: 5,
					maxlength: 100
				},
				department: {
					type: String,
					minlength: 3,
					maxlength: 50
				},
				designation: {
					type: String,
					minlength: 3,
					maxlength: 50,
					required: true
				},
				startDate: {
					type: Number,
					min: 0,
					required: true
				},
				endDate: {
					type: Number
				},
				verified: {
					type: Boolean,
					default: false
				}
			}
		],
		active: {
			type: Boolean,
			default: true
		}
	},
	info: {
		gender: {
			type: String,
			enum: genders,
			required: true
		},
		religion: {
			type: String,
			enum: religions,
			required: true
		},
		bloodGroup: {
			type: String,
			enum: bloodGroups,
			required: true
		},
		dob: {
			type: Number,
			required: true
		}
	},
	identity: {
		fullname: {
			type: String,
			required: true,
			minlength: 5,
			maxlength: 100
		},
		mobileNo: {
			type: String,
			required: true,
			validate: validate.phone
		},
		mobileNoVerified: {
			type: Boolean,
			required: true,
			default: true
		},
		email: {
			type: String,
			required: false,
			validate: validate.email
		},
		emailVerified: {
			type: Boolean,
			required: true,
			default: false
		},
		emailTemp: {
			type: String,
			validate: validate.email
		},
		nid: {
			type: String,
			maxlength: 17,
			minlength: 10
		},
		nidVerified: {
			type: Boolean,
			required: true,
			default: false
		},
		password: {
			type: String,
			required: true,
			default: 'NOT_SET'
		}
	},
	preference: {
		relationshipStatuses: {
			type: [{ type: String, enum: ['Any', ...relationshipStatuses] }],
			default: ['Any']
		},
		ageMin: {
			type: Number,
			min: 18,
			max: 150,
			default: 18
		},
		ageMax: {
			type: Number,
			min: 18,
			max: 150,
			default: 50
		},
		heightMin: {
			type: Number,
			min: 36,
			max: 96,
			default: 36
		},
		heightMax: {
			type: Number,
			min: 36,
			max: 96,
			default: 96
		},
		weightMin: {
			type: Number,
			min: 30,
			max: 150,
			default: 30
		},
		weightMax: {
			type: Number,
			min: 30,
			max: 150,
			default: 150
		},
		districts: {
			type: [{ type: String, enum: ['Any', ...districts] }],
			default: ['Any']
		},
		nationalities: {
			type: [{ type: String, enum: ['Any', ...nationalities] }],
			default: ['Any']
		}
	},
	profileParams: [
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
			enum: ['User', 'Admin', 'SuperAdmin'],
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
	],
	notificationToken: {
		type: String
	},
	socketId: {
		type: String
	},
	interaction: {
		acv: {
			type: Number,
			default: 50
		},
		aav: {
			type: Number,
			default: 50
		},
		cw: {
			type: Number,
			default: 1
		},
		aw: {
			type: Number,
			default: 1
		},
		likes: [
			{
				dateTime: {
					type: Number,
					required: true
				},
				match_id: {
					type: String,
					required: true
				},
				user_id: {
					type: String,
					required: true
				},
				log_id: {
					type: String
				}
			}
		],
		dislikes: [
			{
				dateTime: {
					type: Number,
					required: true
				},
				match_id: {
					type: String,
					required: true
				},
				user_id: {
					type: String,
					required: true
				},
				log_id: {
					type: String
				}
			}
		],
		brokens: [
			{
				dateTime: {
					type: Number,
					required: true
				},
				match_id: {
					type: String,
					required: true
				},
				user_id: {
					type: String,
					required: true
				},
				log_id: {
					type: String
				}
			}
		],
		blocks: [
			{
				dateTime: {
					type: Number,
					required: true
				},
				match_id: {
					type: String,
					required: true
				},
				user_id: {
					type: String,
					required: true
				},
				log_id: {
					type: String
				}
			}
		]
	},
	active: {
		type: Boolean,
		required: true,
		default: true
	}
});

// declare a model
mongoose.model('User', userSchema);
