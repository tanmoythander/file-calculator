var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var vision = require('@google-cloud/vision');
var client = new vision.ImageAnnotatorClient();
var parse = require('./../../../components/parse');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');
var otp = require('./../../../components/otp');
var hash = require('./../../../components/hash');
var storage = require('./../../../components/storage');
var validate = require('./../../../components/validate');
var activity = require('./../../../components/activity');
var butterflySecret = require('./../../../secrets/butterfly');

// Models
var ProfileParam = mongoose.model('ProfileParam');
var User = mongoose.model('User');

// variables
var passRegex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,50}$');

function getStatus(req, res) {
	const user = req.decoded.user;
	const preferenceIsDefault =
		user.preference.relationshipStatuses === ['Single'] &&
		user.preference.ageMin === 18 &&
		user.preference.ageMax === 50 &&
		user.preference.heightMin === 36 &&
		user.preference.heightMax === 96 &&
		user.preference.weightMin === 30 &&
		user.preference.weightMax === 150 &&
		user.preference.districts === ['Any'] &&
		user.preference.nationalities === ['Any'];
	const status = {
		mandatory: {
			profilePhoto: user.profile.photos.length > 0
		},
		optional: {
			email: user.identity.email,
			emailVerified: user.identity.emailVerified,
			matchActivity: user.profile.active,
			nid: user.identity.nidVerified,
			preferenceIsDefault: preferenceIsDefault,
			education: user.profile.education.length > 0,
			work: user.profile.work.length > 0,
			multipleProfilePhoto: user.profile.photos.length > 1,
			multipleEducation: user.profile.education.length > 1,
			multipleWork: user.profile.work.length > 1
		}
	};
	return res.status(200).send({
		state: 'success',
		message: 'User profile status returned',
		status: status
	});
}

function get(req, res) {
	return res.status(200).send({
		state: 'success',
		message: 'User profile returned',
		profile: req.decoded.user.profile
	});
}

function set(req, res) {
	// validation
	if (req.body.nickname
		&& !/^[a-zA-Z]+$/.test(req.body.nickname.toString().trim())) {
		return res.status(200).send({
			state: 'failure',
			message: 'Only A-Z and a-z are allowed in nickname'
		});
	}
	if (req.body.height
		&& isNaN(parseFloat(req.body.height))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid height value'
		});
	}
	if (req.body.weight
		&& isNaN(parseFloat(req.body.weight))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid weight value'
		});
	}
	if (!req.body.nickname && !req.body.about
		&& !req.body.relationshipStatus && !req.body.height
		&& !req.body.weight && !req.body.district && !req.body.nationality) {
		return res.status(200).send({
			state: 'failure',
			message: 'Nothing to update'
		});
	}
	User.findById(req.decoded.user._id, function(err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		var oldDoc = Object.assign({}, user);
		// set new values
		if (req.body.nickname) {
			user.profile.nickname = req.body.nickname.toString().trim();
		}
		if (req.body.about) {
			user.profile.about = req.body.about.toString().trim();
		}
		if (req.body.relationshipStatus) {
			user.profile.relationshipStatus =
				req.body.relationshipStatus.toString().trim();
		}
		if (req.body.height) {
			user.profile.height = parseFloat(req.body.height);
		}
		if (req.body.weight) {
			user.profile.weight = parseFloat(req.body.weight);
		}
		if (req.body.district) {
			user.profile.district = req.body.district.toString().trim();
		}
		if (req.body.nationality) {
			user.profile.nationality = req.body.nationality.toString().trim();
		}
		// create log
		var newDoc = Object.assign({}, user);
		var details = 'User profile updated';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (uLog) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						// save activity
						activity.save(
							savedUser._id.toString(),
							savedUser._id.toString(),
							'edit-profile',
							'Updated public profile',
							uLog._id.toString()
						);
						return res.status(200).send({
							state: 'success',
							message: 'User profile updated',
							profile: savedUser.profile
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function updatePhotos(req, res) {
	// Validation
	if (!req.body.filenames || req.body.filenames.length < 1) {
		return res.status(200).send({
			state: 'failure',
			message: 'At least one profile photo must be kept'
		});
	}
	if (!req.body.filenames.every(i => typeof i === 'string')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid filenames'
		});
	}
	User.findById(req.decoded.user._id, function(err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// process photos
		var newPhotos = [];
		req.body.filenames.forEach(function(item) {
			const foundPhoto = user.profile.photos.find(pItem => pItem.filename === item);
			if (foundPhoto) {
				newPhotos.push(foundPhoto);
			}
		});
		if (newPhotos.length < 1) {
			return res.status(200).send({
				state: 'failure',
				message: 'Invalid filenames'
			});
		}
		var removablePhotos = user.profile.photos.filter(
			item => newPhotos.indexOf(item) < 0);
		var oldDoc = Object.assign({}, user);
		// set new values
		user.profile.photos = newPhotos;
		// create log
		var newDoc = Object.assign({}, user);
		var details = `User ${
			removablePhotos.length < 1 ? 'rearranged' : 'deleted ' + removablePhotos.length
		} profile photos`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (uLog) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						storage.deleteFiles(removablePhotos).then(function(result) {
							// eslint-disable-next-line no-console
							console.log(result);
						}, function(err) {
							// eslint-disable-next-line no-console
							console.error(err);
						});
						// save activity
						activity.save(
							savedUser._id.toString(),
							savedUser._id.toString(),
							'edit-profile',
							'Deleted profile photo',
							uLog._id.toString()
						);
						return res.status(200).send({
							state: 'success',
							message: 'User profile photos updated',
							profile: savedUser.profile
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function uploadPhotos(req, res) {
	// Validation
	if (!req.files || req.files.length < 1) {
		return res.status(200).send({
			state: 'failure',
			message: 'At least one profile photo is required'
		});
	}
	// process photos
	var uploadedPhotos = [];
	req.files.forEach(function(file) {
		const photo = {
			filename: file.filename,
			destination: file.destination,
			url: storage.getProfileBaseUrl() + file.filename,
			verified: false				// TODO: Add verification against NID
		};
		uploadedPhotos.push(photo);
	});
	User.findById(req.decoded.user._id, function(err, user) {
		if (err) {
			storage.deleteFiles(req.files).then(function() {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}, function(storageErr) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error | Storage error',
					error: err,
					storageError: storageErr
				});
			});
		} else if (uploadedPhotos.length + user.profile.photos.length
			> butterflySecret.limits.freeMaxProfilePhotos) {
			// TODO: Add Package verification
			storage.deleteFiles(req.files).then(function() {
				return res.status(200).send({
					state: 'failure',
					message: 'Maximum profile photo limit exceeded'
				});
			}, function(storageErr) {
				return res.status(200).send({
					state: 'failure',
					message: 'Maximum profile photo limit exceeded | Storage error',
					storageError: storageErr
				});
			});
		}
		var oldDoc = Object.assign({}, user);
		// set new values
		user.profile.photos = [...uploadedPhotos, ...user.profile.photos];
		// create log
		var newDoc = Object.assign({}, user);
		var details = `User uploaded ${uploadedPhotos.length} profile photos`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (uLog) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							storage.deleteFiles(req.files).then(function() {
								return res.status(500).send({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}, function(storageErr) {
								return res.status(500).send({
									state: 'failure',
									message: 'database error | Storage error',
									error: err,
									storageError: storageErr
								});
							});
						}
						// save activity
						activity.save(
							savedUser._id.toString(),
							savedUser._id.toString(),
							'edit-profile',
							'Added new profile photo',
							uLog._id.toString()
						);
						return res.status(200).send({
							state: 'success',
							message: 'User profile photos uploaded',
							profile: savedUser.profile
						});
					});
				},
				function (err) {
					storage.deleteFiles(req.files).then(function() {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}, function(storageErr) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error | Storage error',
							error: err,
							storageError: storageErr
						});
					});
				}
			);
	});
}

function setEducation(req, res) {
	// validation
	if (!req.body.education || !Array.isArray(req.body.education)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Education array is required'
		});
	}
	if (!req.body.education.every(i =>
		typeof i === 'object' &&
		i.degree && i.degree !== '' &&
		typeof i.degree === 'string' &&
		i.instituteName && i.instituteName !== '' &&
		typeof i.instituteName === 'string' &&
		i.department && i.department !== '' &&
		typeof i.department === 'string' &&
		i.passingYear && !isNaN(i.passingYear) &&
		i.passingYear <= (new Date()).getFullYear())) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid education info'
		});
	}
	User.findById(req.decoded.user._id, function(err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// process education info
		var educationInfo = [];
		req.body.education.forEach(function(item) {
			educationInfo.push({
				degree: item.degree.trim(),
				instituteName: item.instituteName.trim(),
				department: item.department.trim(),
				passingYear: item.passingYear,
				verified: false
			});
		});
		var oldDoc = Object.assign({}, user);
		// set new values
		user.profile.education = educationInfo;
		// create log
		var newDoc = Object.assign({}, user);
		var details = 'User education info updated';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (uLog) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'User education info updated',
							profile: savedUser.profile
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function setWork(req, res) {
	// validation
	if (!req.body.work || !Array.isArray(req.body.work)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Work array is required'
		});
	}
	if (!req.body.work.every(i =>
		typeof i === 'object' &&
		i.workplaceName && i.workplaceName !== '' &&
		typeof i.workplaceName === 'string' &&
		i.designation && i.designation !== '' &&
		typeof i.designation === 'string' &&
		i.startDate && !isNaN(i.startDate))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid work info'
		});
	}
	User.findById(req.decoded.user._id, function(err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// process work info
		var workInfo = [];
		req.body.work.forEach(function(item) {
			workInfo.push({
				workplaceName: item.workplaceName.trim(),
				address: item.address && item.address !== '' &&
					typeof item.address === 'string' ? item.address.trim() : undefined,
				department: item.department && item.department !== '' &&
					typeof item.department === 'string' ? item.department.trim() : undefined,
				designation: item.designation.trim(),
				startDate: item.startDate,
				endDate: item.endDate && !isNaN(item.endDate) &&
					item.endDate > item.startDate ? item.endDate : undefined,
				verified: false
			});
		});
		var oldDoc = Object.assign({}, user);
		// set new values
		user.profile.work = workInfo;
		// create log
		var newDoc = Object.assign({}, user);
		var details = 'User work info updated';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (uLog) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'User work info updated',
							profile: savedUser.profile
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function setProfileActiveStatus(req, res) {
	User.findById(req.decoded.user._id, function(err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// set new values
		user.profile.active = req.body.active !== undefined
			&& req.body.active === false ? false : true;
		// create log
		var details = `User profile active status set to "${
			req.body.active !== undefined && req.body.active
			=== false ? 'true' : 'false'}"`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				{},
				{},
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (uLog) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						// save activity
						activity.save(
							savedUser._id.toString(),
							savedUser._id.toString(),
							savedUser.profile.active ? 'on' : 'off',
							`${savedUser.profile.active
								? 'Enabled' : 'Disabled'} partner discovery`,
							uLog._id.toString()
						);
						return res.status(200).send({
							state: 'success',
							message: 'User profile active status updated',
							profile: savedUser.profile
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function getPreference(req, res) {
	return res.status(200).send({
		state: 'success',
		message: 'User preference returned',
		user: req.decoded.user.preference
	});
}

function setPreference(req, res) {
	// Validation
	if (req.body.relationshipStatuses && req.body.relationshipStatuses.length < 1) {
		return res.status(200).send({
			state: 'failure',
			message: 'At least one relationship status is required'
		});
	}
	if (req.body.relationshipStatuses
		&& !req.body.relationshipStatuses.every(i => typeof i === 'string')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid relationship statuses'
		});
	}
	if (req.body.districts && req.body.districts.length < 1) {
		return res.status(200).send({
			state: 'failure',
			message: 'At least one district is required'
		});
	}
	if (req.body.districts
		&& !req.body.districts.every(i => typeof i === 'string')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid districts'
		});
	}
	if (req.body.nationalities && req.body.nationalities.length < 1) {
		return res.status(200).send({
			state: 'failure',
			message: 'At least one nationality is required'
		});
	}
	if (req.body.nationalities
		&& !req.body.nationalities.every(i => typeof i === 'string')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid nationalities'
		});
	}
	if (req.body.ageMin
		&& isNaN(parseInt(req.body.ageMin))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid ageMin value'
		});
	} else if (req.body.ageMin && !req.body.ageMax) {
		return res.status(200).send({
			state: 'failure',
			message: 'ageMax is required with ageMin'
		});
	}
	if (req.body.ageMax
		&& isNaN(parseInt(req.body.ageMax))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid ageMax value'
		});
	} else if (req.body.ageMax && !req.body.ageMin) {
		return res.status(200).send({
			state: 'failure',
			message: 'ageMin is required with ageMax'
		});
	}
	if (req.body.ageMin && req.body.ageMax
		&& parseInt(req.body.ageMin) > parseInt(req.body.ageMax)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid ageMin and ageMax value'
		});
	}
	if (req.body.heightMin
		&& isNaN(parseFloat(req.body.heightMin))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid heightMin value'
		});
	} else if (req.body.heightMin && !req.body.heightMax) {
		return res.status(200).send({
			state: 'failure',
			message: 'heightMax is required with heightMin'
		});
	}
	if (req.body.heightMax
		&& isNaN(parseFloat(req.body.heightMax))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid heightMax value'
		});
	} else if (req.body.heightMax && !req.body.heightMin) {
		return res.status(200).send({
			state: 'failure',
			message: 'heightMin is required with heightMax'
		});
	}
	if (req.body.heightMin && req.body.heightMax
		&& parseFloat(req.body.heightMin) > parseFloat(req.body.heightMax)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid heightMin and heightMax value'
		});
	}
	if (req.body.weightMin
		&& isNaN(parseFloat(req.body.weightMin))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid weightMin value'
		});
	} else if (req.body.weightMin && !req.body.weightMax) {
		return res.status(200).send({
			state: 'failure',
			message: 'weightMax is required with weightMin'
		});
	}
	if (req.body.weightMax
		&& isNaN(parseFloat(req.body.weightMax))) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid weightMax value'
		});
	} else if (req.body.weightMax && !req.body.weightMin) {
		return res.status(200).send({
			state: 'failure',
			message: 'weightMin is required with weightMax'
		});
	}
	if (req.body.weightMin && req.body.weightMax
		&& parseFloat(req.body.weightMin) > parseFloat(req.body.weightMax)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid weightMin and weightMax value'
		});
	}
	if (!req.body.relationshipStatuses && !req.body.districts
		&& !req.body.nationalities && !req.body.ageMin
		&& !req.body.heightMin && !req.body.weightMin) {
		return res.status(200).send({
			state: 'failure',
			message: 'Nothing to update'
		});
	}
	User.findById(req.decoded.user._id, function(err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (user.info.gender === 'Female'
			&& (req.body.ageMin < 21 || req.body.ageMax < 21)) {
			return res.status(200).send({
				state: 'failure',
				message: 'Minimum age for male partner is 21'
			});
		}
		var oldDoc = Object.assign({}, user);
		// set new values
		if (req.body.relationshipStatuses) {
			user.preference.relationshipStatuses =
				req.body.relationshipStatuses.map(i => i.trim());
		}
		if (req.body.districts) {
			user.preference.districts =
				req.body.districts.map(i => i.trim());
		}
		if (req.body.nationalities) {
			user.preference.nationalities =
				req.body.nationalities.map(i => i.trim());
		}
		if (req.body.ageMin) {
			user.preference.ageMin = parseInt(req.body.ageMin);
			user.preference.ageMax = parseInt(req.body.ageMax);
		}
		if (req.body.heightMin) {
			user.preference.heightMin = parseInt(req.body.heightMin);
			user.preference.heightMax = parseInt(req.body.heightMax);
		}
		if (req.body.weightMin) {
			user.preference.weightMin = parseInt(req.body.weightMin);
			user.preference.weightMax = parseInt(req.body.weightMax);
		}
		// create log
		var newDoc = Object.assign({}, user);
		var details = 'User preference updated';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (uLog) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						// save activity
						activity.save(
							savedUser._id.toString(),
							savedUser._id.toString(),
							'partner-preference',
							'Updated partner preference',
							uLog._id.toString()
						);
						return res.status(200).send({
							state: 'success',
							message: 'User preference updated',
							preference: savedUser.preference
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function getAllParams(req, res) {
	var query = ProfileParam.find(
		{
			active: true
		},
		function (err, profileParams) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			return res.status(200).send({
				state: 'success',
				message: 'Returned all profile parameters',
				profileParams: profileParams.map(item => {
					item.created = undefined;
					return item;
				})
			});
		}
	);
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function setParams(req, res) {
	// API Validation
	if (!req.body.paramName || req.body.paramName === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Parameter name is required'
		});
	}
	if (!req.body.paramValue || req.body.paramValue === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Parameter value is required'
		});
	}
	ProfileParam.findOne(
		{
			paramName: req.body.paramName,
			active: true
		},
		function (err, profileParam) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!profileParam) {
				return res.status(200).send({
					state: 'failure',
					message: req.body.paramName + ' update is disabled'
				});
			}
			User.findById(req.decoded.user._id, function (err, user) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				var oldDoc = Object.assign({}, user);
				var userProfileParam = user.profileParams.find(function (item) {
					return item.paramName === profileParam.paramName;
				});
				if (userProfileParam) {
					var pIndex = user.profileParams.indexOf(userProfileParam);
					user.profileParams[
						pIndex
					].paramValue = req.body.paramValue.toString();
					user.profileParams[pIndex].param_id = profileParam._id;
				} else {
					user.profileParams.push({
						param_id: profileParam._id,
						paramName: profileParam.paramName,
						paramValue: req.body.paramValue.toString()
					});
				}
				// create log
				var newDoc = Object.assign({}, user);
				var details = 'User ' + profileParam.paramName + ' updated';
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = user._id;
				log
					.create(
						'update',
						details,
						'User',
						oldDoc,
						newDoc,
						appName,
						appKey,
						member_id,
						'User'
					)
					.then(
						function (uLog) {
							user.updates.push({
								dateTime: dateTime.now(),
								member_id: 'SELF',
								memberType: 'User',
								log_id: uLog._id
							});
							user.save(function (err, savedUser) {
								if (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								return res.status(200).send({
									state: 'success',
									message: 'User profile parameter updated',
									user: parse.user(savedUser)
								});
							});
						},
						function (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
					);
			});
		}
	);
}

function getEmailOTP(req, res) {
	User.findById(req.decoded.user._id, function (err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!user.identity.emailTemp && user.identity.emailVerified) {
			return res.status(200).send({
				state: 'failure',
				message: 'Email already verified'
			});
		}
		var vEmail = undefined;
		if (user.identity.emailVerified) {
			vEmail = user.identity.emailTemp;
		} else {
			vEmail = user.identity.email;
		}
		// Send Email Link
		otp.send.email(vEmail, user._id, 'User').then(
			function (result) {
				// create log
				var details = 'User requested verification email';
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = user._id;
				log
					.create(
						'read',
						details,
						'Email',
						{},
						{},
						appName,
						appKey,
						member_id,
						'User'
					)
					.then(
						// eslint-disable-next-line no-unused-vars
						function (log) {
							return res.status(200).send(result);
						},
						function (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
					);
			},
			err => res.status(err.error ? 500 : 200).send(err)
		);
	});
}

function setEmail(req, res) {
	// API Validation
	if (!req.body.email || req.body.email === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Email address is required'
		});
	}
	if (!validate.emailExt(req.body.email)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Email address is invalid'
		});
	}
	User.findOne(
		{
			$or: [
				{ 'identity.email': req.body.email },
				{ 'identity.emailTemp': req.body.email }
			]
		},
		function (err, emailUser) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (emailUser) {
				return res.status(200).send({
					state: 'failure',
					message: 'Email already registered'
				});
			}
			User.findById(req.decoded.user._id, function (err, user) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}

				// create log
				var oldDoc = Object.assign({}, user);
				if (user.identity.emailVerified) {
					user.identity.emailTemp = req.body.email;
				} else {
					user.identity.email = req.body.email;
					user.identity.emailTemp = undefined;
				}
				var newDoc = Object.assign({}, user);
				var details = 'User email updated, awaiting verification';
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = user._id;
				log
					.create(
						'update',
						details,
						'User',
						oldDoc,
						newDoc,
						appName,
						appKey,
						member_id,
						'User'
					)
					.then(
						function (log) {
							user.updates.push({
								dateTime: dateTime.now(),
								member_id: 'SELF',
								memberType: 'User',
								log_id: log._id
							});
							user.save(function (err, savedUser) {
								if (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								// Send Email Link
								otp.send.email(req.body.email,
									savedUser._id, 'User').then(
									result => res.status(200).send(result),
									err => res.status(err.error ? 500 : 200).send(err)
								);
							});
						},
						function (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
					);
			});
		}
	);
}

function removeEmail(req, res) {
	User.findById(req.decoded.user._id, function (err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!user.identity.emailTemp || user.identity.emailTemp === '') {
			return res.status(200).send({
				state: 'failure',
				message: 'Unverified email not found'
			});
		}

		// create log
		var oldDoc = Object.assign({}, user);
		user.identity.emailTemp = undefined;
		var newDoc = Object.assign({}, user);
		var details = 'User unverified email removed';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (log) {
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: log._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Unverified email removed successfully',
							user: parse.user(savedUser)
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function setPassword(req, res) {
	// API Validation
	if (!req.body.oldPassword || req.body.oldPassword === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Old password is required'
		});
	}
	if (!req.body.newPassword || req.body.newPassword === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'New password is required'
		});
	}
	User.findById(req.decoded.user._id, function (err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!hash.inSync(user.identity.password, req.body.oldPassword)) {
			return res.status(200).send({
				state: 'failure',
				message: 'Incorrect old password'
			});
		}
		if (!passRegex.test(req.body.newPassword)) {
			return res.status(200).send({
				state: 'failure',
				message:
					'Password must include minimum 8' +
					' and maximum 50 characters, at least one uppercase letter,' +
					' one lowercase letter and one number'
			});
		}
		var oldDoc = Object.assign({}, user);
		user.identity.password = hash.create(req.body.newPassword);
		// create log
		var newDoc = Object.assign({}, user);
		var details = 'User password changed';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = user._id;
		log
			.create(
				'update',
				details,
				'User',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				'User'
			)
			.then(
				function (log) {
					// save the user
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: 'SELF',
						memberType: 'User',
						log_id: log._id
					});
					user.save(function (err, savedUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'User password updated',
							user: parse.user(savedUser)
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function setNidFront(req, res) {
	// Get user info
	User.findById(req.decoded.user._id, async function (err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (user.identity.nidVerified) {
			return res.status(200).send({
				state: 'failure',
				message: 'User already has a verified NID'
			});
		}
		// validation
		if (!req.body.base64) {
			return res.status(200).send({
				state: 'failure',
				message: 'Image base64 is required'
			});
		}
		var gCloudRequest = {
			image: {
				content: req.body.base64
			},
			features: [{ type: 'TEXT_DETECTION' }],
			imageContext: {
				languageHints: ['en', 'bn']
			}
		};
		try {
			const result = await client.annotateImage(gCloudRequest);
			if (result.length > 0 && result[0].fullTextAnnotation) {
				// Attempt processing the annotated text
				var list = result[0].fullTextAnnotation.text.split('\n');
				var trimmedList = [];
				var name = undefined;
				var dob = undefined;
				var id = undefined;
				list.forEach(item => {
					var line = item.split(':');
					var trimmedLine = line.map(item => item.trim());
					trimmedList.push(trimmedLine);
				});
				trimmedList.forEach((item, index) => {
					if (item.length > 1) {
						if (item[0].toLowerCase() === 'name') {
							if (!name) name = item[1];
						} else if (item[0].toLowerCase() === 'date of birth') {
							if (!dob) dob = item[1];
						} else if (item[0].toLowerCase() === 'id no') {
							if (!id) id = item[1];
						}
					} else if (item.length === 1) {
						if (item[0] === 'Name') {
							if (!name) name = trimmedList[index + 1][0];
						} else {
							const dobIndex = item[0].search('Date of Birth ');
							const nidIndex = item[0].search('NID No ');
							const nidIndexDot = item[0].search('NID No. ');
							const nidIndex2 = item[0].search('NID NO ');
							const nidIndexDot2 = item[0].search('NID NO. ');
							const nidIndex3 = item[0].search('NIO No ');
							const nidIndexDot3 = item[0].search('NIO No. ');
							const nidIndex23 = item[0].search('NIO NO ');
							const nidIndexDot23 = item[0].search('NIO NO. ');
							/* eslint-disable curly */
							if (dobIndex > -1) {
								if (!dob)
									dob = item[0].substring(dobIndex + 14, item[0].length);
							} else if (nidIndex > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndex + 7, item[0].length)
										.split(' ')
										.join('');
							} else if (nidIndexDot > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndexDot + 8, item[0].length)
										.split(' ')
										.join('');
							} else if (nidIndex2 > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndex2 + 7, item[0].length)
										.split(' ')
										.join('');
							} else if (nidIndexDot2 > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndexDot2 + 8, item[0].length)
										.split(' ')
										.join('');
							} else if (nidIndex3 > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndex3 + 7, item[0].length)
										.split(' ')
										.join('');
							} else if (nidIndexDot3 > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndexDot3 + 8, item[0].length)
										.split(' ')
										.join('');
							} else if (nidIndex23 > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndex23 + 7, item[0].length)
										.split(' ')
										.join('');
							} else if (nidIndexDot23 > -1) {
								if (!id)
									id = item[0]
										.substring(nidIndexDot23 + 8, item[0].length)
										.split(' ')
										.join('');
							}
							/* eslint-enable curly */
						}
					}
				});
				if (!name || !dob || !id) {
					return res.status(200).send({
						state: 'failure',
						message: 'Could not detect NID frontside'
					});
				}
				User.findOne(
					{
						'identity.nid': id.length >= 17 ? new RegExp(id.substring(4, 17)) : id,
						'identity.nidVerified': true
					},
					function (err, existingNidUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						if (existingNidUser) {
							return res.status(200).send({
								state: 'failure',
								message: 'NID already registered'
							});
						}
						var oldDoc = Object.assign({}, user);
						user.identity.fullname = name;
						user.identity.nid = id;
						user.info.dob = new Date(dob).getTime();
						var newDoc = Object.assign({}, user);
						var details = 'User NID added';
						var appName = req.decoded.appKey.name;
						var appKey = req.decoded.appKey.token;
						var member_id = user._id;
						// create log
						log
							.create(
								'update',
								details,
								'User',
								oldDoc,
								newDoc,
								appName,
								appKey,
								member_id,
								'User'
							)
							.then(
								function (log) {
									// save the user
									user.updates.push({
										dateTime: dateTime.now(),
										member_id: 'SELF',
										memberType: 'User',
										log_id: log._id
									});
									// eslint-disable-next-line no-unused-vars
									user.save(function (err, user) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}
										return res.status(200).send({
											state: 'success',
											message: 'NID frontside detected',
											result: {
												name: name,
												dob: dob,
												nid: id
											}
										});
									});
								},
								function (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
							);
					}
				);
			} else {
				return res.status(200).send({
					state: 'failure',
					message: 'Could not detect NID frontside'
				});
			}
		} catch (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'Cloud error',
				error: err
			});
		}
	});
}

function setNidBack(req, res) {
	// Get user info
	User.findById(req.decoded.user._id, async function (err, user) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (user.identity.nidVerified) {
			return res.status(200).send({
				state: 'failure',
				message: 'User already has a verified NID'
			});
		}
		// validation
		if (!req.body.base64) {
			return res.status(200).send({
				state: 'failure',
				message: 'Image base64 is required'
			});
		}
		var gCloudRequest = {
			image: {
				content: req.body.base64
			},
			features: [{ type: 'TEXT_DETECTION' }],
			imageContext: {
				languageHints: ['en', 'bn']
			}
		};
		try {
			const result = await client.annotateImage(gCloudRequest);
			if (result.length > 0 && result[0].fullTextAnnotation) {
				// Attempt processing the annotated text
				var addressIndex = result[0].fullTextAnnotation.text.search('ঠিকানা:');
				if (addressIndex < 0) {
					return res.status(200).send({
						state: 'failure',
						message: 'Could not detect NID backside'
					});
				}
				var oldDoc = Object.assign({}, user);
				user.identity.nidVerified = true;
				// create log
				var newDoc = Object.assign({}, user);
				var details = 'User NID verified';
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = user._id;
				log
					.create(
						'update',
						details,
						'User',
						oldDoc,
						newDoc,
						appName,
						appKey,
						member_id,
						'User'
					)
					.then(
						function (log) {
							// save the user
							user.updates.push({
								dateTime: dateTime.now(),
								member_id: 'SELF',
								memberType: 'User',
								log_id: log._id
							});
							// eslint-disable-next-line no-unused-vars
							user.save(function (err, user) {
								if (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								return res.status(200).send({
									state: 'success',
									message: 'NID backside detected'
								});
							});
						},
						function (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
					);
			} else {
				return res.status(200).send({
					state: 'failure',
					message: 'Could not detect NID backside'
				});
			}
		} catch (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'Cloud error',
				error: err
			});
		}
	});
}

module.exports = {
	getStatus,
	get,
	set,
	updatePhotos,
	uploadPhotos,
	setEducation,
	setWork,
	setProfileActiveStatus,
	getPreference,
	setPreference,
	getAllParams,
	setParams,
	getEmailOTP,
	setEmail,
	removeEmail,
	setPassword,
	setNidFront,
	setNidBack
};
