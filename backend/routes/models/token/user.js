var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var jwt = require('jsonwebtoken');
var jwtSecret = require('./../../../secrets/jwt');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');
var validate = require('./../../../components/validate');
var otp = require('./../../../components/otp');
var parse = require('./../../../components/parse');
var hash = require('./../../../components/hash');
var notification = require('./../../../components/notification');

// Models
var User = mongoose.model('User');

// variables
var passRegex = new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,50}$');

// Functions
function login(req, res) {
	// API Validation
	if (!req.body.username || req.body.username === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Username is required'
		});
	}
	if (
		!validate.phoneExt(req.body.username) &&
		!validate.phoneExt('+88' + req.body.username) &&
		!validate.emailExt(req.body.username)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Username is invalid'
		});
	}
	if (!req.body.password || req.body.password === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Password is required'
		});
	}
	if (!req.body.notificationToken ||
		typeof req.body.notificationToken !== 'string' ||
		req.body.notificationToken.length < 20) {
		return res.status(200).send({
			state: 'failure',
			message: 'Valid notification token is required'
		});
	}
	User.findOne(
		{
			$or: [
				{
					'identity.email': req.body.username,
					'identity.emailVerified': true
				},
				{
					'identity.mobileNo': req.body.username,
					'identity.mobileNoVerified': true
				},
				{
					'identity.mobileNo': '+88' + req.body.username,
					'identity.mobileNoVerified': true
				}
			]
		},
		function (err, user) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!user) {
				return res.status(200).send({
					state: 'failure',
					message: 'Incorrect login information'
				});
			}
			if (!hash.inSync(user.identity.password, req.body.password)) {
				return res.status(200).send({
					state: 'failure',
					message: 'Incorrect password'
				});
			}
			if (!user.active) {
				return res.status(200).send({
					state: 'failure',
					message: 'Account is suspended'
				});
			}
			jwt.sign(
				{ _id: user._id.toString() },
				jwtSecret.user.secret,
				{ expiresIn: jwtSecret.user.expiresIn },
				function (err, token) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'token generation failed',
							error: err
						});
					}
					var details = 'User logged in with credentials';
					var appName = req.decoded.appKey.name;
					var appKey = req.decoded.appKey.token;
					var member_id = user._id;
					// create log in background
					log
						.create(
							'read',
							details,
							'User',
							{},
							{},
							appName,
							appKey,
							member_id,
							'User'
						)
						// eslint-disable-next-line
						.then(
							// eslint-disable-next-line no-empty-function
							function () {},
							// eslint-disable-next-line no-console
							err => console.err(err)
						);
					// set notification token (if eligible) in background
					notification.setToken(
						user._id,
						req.body.notificationToken,
						appName,
						appKey
					).then(function() {
						return res.status(200).send({
							state: 'success',
							message: 'Successfully logged in',
							token: token,
							user: parse.user(user)
						});
					}, function(err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					});
				}
			);
		}
	);
}

function checkMobile(req, res) {
	// API Validation
	if (!req.body.mobileNo || req.body.mobileNo === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is required'
		});
	}
	if (
		!validate.phoneExt(req.body.mobileNo) &&
		!validate.phoneExt('+88' + req.body.mobileNo)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is invalid'
		});
	}
	User.findOne(
		{
			$or: [
				{ 'identity.mobileNo': req.body.mobileNo },
				{ 'identity.mobileNo': '+88' + req.body.mobileNo }
			]
		},
		function (err, user) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!user) {
				return res.status(200).send({
					state: 'success',
					message: 'Mobile number is not registered',
					registered: false
				});
			}
			return res.status(200).send({
				state: 'success',
				message: 'Mobile number is registered',
				registered: true
			});
		}
	);
}

function checkEmail(req, res) {
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
		function (err, user) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!user) {
				return res.status(200).send({
					state: 'success',
					message: 'Email address is not registered',
					registered: false
				});
			}
			return res.status(200).send({
				state: 'success',
				message: 'Email address is registered',
				registered: true
			});
		}
	);
}

function sendMobileOTP(req, res) {
	// API Validation
	if (!req.body.mobileNo || req.body.mobileNo === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is required'
		});
	}
	if (
		!validate.phoneExt(req.body.mobileNo) &&
		!validate.phoneExt('+88' + req.body.mobileNo)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is invalid'
		});
	}
	otp.send.mobile(req.body.mobileNo).then(
		function (result) {
			// create log
			var oldDoc = {};
			var newDoc = {};
			var details = 'Someone requested OTP for ' + req.body.mobileNo;
			var appName = req.decoded.appKey.name;
			var appKey = req.decoded.appKey.token;
			var member_id = 'UNKNOWN';
			log
				.create(
					'create',
					details,
					'SMS',
					oldDoc,
					newDoc,
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
}

function verifyMobileOTP(req, res) {
	// API Validation
	if (!req.body.otp || req.body.otp === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'OTP is required'
		});
	}
	if (req.body.otp.length !== 6) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid OTP'
		});
	}
	if (
		!validate.phoneExt(req.body.mobileNo) &&
		!validate.phoneExt('+88' + req.body.mobileNo)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is invalid'
		});
	}

	if (req.body.mobileNo.length === 11) {
		req.body.mobileNo = '+88' + req.body.mobileNo;
	}
	// verify OTP
	otp.check
		.mobile(req.body.mobileNo, req.body.otp)
		// eslint-disable-next-line no-unused-vars
		.then(
			result => res.status(200).send(result),
			err => res.status(err.error ? 500 : 200).send(err)
		);
}

function resetByMobileOTP(req, res) {
	// API Validation
	if (!req.body.otp || req.body.otp === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'OTP is required'
		});
	}
	if (req.body.otp.length !== 6) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid OTP'
		});
	}
	if (
		!validate.phoneExt(req.body.mobileNo) &&
		!validate.phoneExt('+88' + req.body.mobileNo)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is invalid'
		});
	}
	if (!req.body.notificationToken ||
		typeof req.body.notificationToken !== 'string' ||
		req.body.notificationToken.length < 20) {
		return res.status(200).send({
			state: 'failure',
			message: 'Valid notification token is required'
		});
	}

	if (req.body.mobileNo.length === 11) {
		req.body.mobileNo = '+88' + req.body.mobileNo;
	}
	// verify OTP
	otp.verify.user.mobile(req.body.mobileNo, req.body.otp).then(
		// eslint-disable-next-line no-unused-vars
		function (result) {
			// validate other info
			if (!req.body.password || req.body.password === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Password is required'
				});
			}
			if (!passRegex.test(req.body.password)) {
				return res.status(200).send({
					state: 'failure',
					message:
						'Password must include minimum 8' +
						' and maximum 50 characters, at least one uppercase letter,' +
						' one lowercase letter and one number'
				});
			}
			User.findOne(
				{
					'identity.mobileNo': req.body.mobileNo
				},
				function (err, mobileUser) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					if (!mobileUser) {
						return res.status(200).send({
							state: 'failure',
							message: 'Mobile number not registered'
						});
					}
					if (!mobileUser.active) {
						return res.status(200).send({
							state: 'failure',
							message: 'Account is suspended'
						});
					}

					// create log
					var oldDoc = Object.assign({}, mobileUser);
					mobileUser.identity.password = hash.create(req.body.password);
					var newDoc = Object.assign({}, mobileUser);
					var details = 'User password reset';
					var appName = req.decoded.appKey.name;
					var appKey = req.decoded.appKey.token;
					var member_id = mobileUser._id;
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
								mobileUser.updates.push({
									dateTime: dateTime.now(),
									member_id: 'SELF',
									memberType: 'User',
									log_id: log._id
								});
								mobileUser.save(function (err, updatedUser) {
									if (err) {
										return res.status(500).send({
											state: 'failure',
											message: 'database error',
											error: err
										});
									}
									// create token
									jwt.sign(
										{ _id: updatedUser._id.toString() },
										jwtSecret.user.secret,
										{ expiresIn: jwtSecret.user.expiresIn },
										function (err, token) {
											if (err) {
												return res.status(500).send({
													state: 'failure',
													message: 'token generation failed',
													error: err
												});
											}
											// set notification token (if eligible) in background
											notification.setToken(
												updatedUser._id,
												req.body.notificationToken,
												appName,
												appKey
											).then(function() {
												return res.status(200).send({
													state: 'success',
													message: 'Successfully reset password',
													token: token,
													user: parse.user(updatedUser)
												});
											}, function(err) {
												return res.status(500).send({
													state: 'failure',
													message: 'database error',
													error: err
												});
											});
										}
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
				}
			);
		},
		function (err) {
			return res.status(err.error ? 500 : 200).send(err);
		}
	);
}

function signupByMobileOTP(req, res) {
	// API Validation
	if (!req.body.otp || req.body.otp === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'OTP is required'
		});
	}
	if (req.body.otp.length !== 6) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid OTP'
		});
	}
	if (!req.body.mobileNo || req.body.mobileNo === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is required'
		});
	}
	if (
		!validate.phoneExt(req.body.mobileNo) &&
		!validate.phoneExt('+88' + req.body.mobileNo)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number is invalid'
		});
	}
	if (!req.body.notificationToken ||
		typeof req.body.notificationToken !== 'string' ||
		req.body.notificationToken.length < 20) {
		return res.status(200).send({
			state: 'failure',
			message: 'Valid notification token is required'
		});
	}

	if (req.body.mobileNo.length === 11) {
		req.body.mobileNo = '+88' + req.body.mobileNo;
	}
	// verify OTP
	otp.verify.user.mobile(req.body.mobileNo, req.body.otp).then(
		// eslint-disable-next-line no-unused-vars
		function (result) {
			// validate other info
			if (!req.body.fullname || req.body.fullname === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Full name is required'
				});
			}
			if (!req.body.nickname || req.body.nickname === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Nickname is required'
				});
			} else if (!/^[a-zA-Z]+$/.test(req.body.nickname.toString().trim())) {
				return res.status(200).send({
					state: 'failure',
					message: 'Only A-Z and a-z are allowed in nickname'
				});
			}
			// if (!req.body.about || req.body.about === '') {
			// 	return res.status(200).send({
			// 		state: 'failure',
			// 		message: 'About is required'
			// 	});
			// }
			if (!req.body.relationshipStatus || req.body.relationshipStatus === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Relationship status is required'
				});
			}
			if (!req.body.gender || req.body.gender === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Gender is required'
				});
			}
			if (!req.body.religion || req.body.religion === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Religion is required'
				});
			}
			if (!req.body.bloodGroup || req.body.bloodGroup === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Blood group is required'
				});
			}
			if (!req.body.dob) {
				return res.status(200).send({
					state: 'failure',
					message: 'Date of birth is required'
				});
			} else if (isNaN(parseInt(req.body.dob))) {
				return res.status(200).send({
					state: 'failure',
					message: 'Date of birth is invalid'
				});
			} else if (req.body.gender === 'Male'
				&& (dateTime.now() - parseInt(req.body.dob))
				/ (365.25 * 24 * 60 * 60 * 1000) < 21) {
				return res.status(200).send({
					state: 'failure',
					message: 'Age of male user must be at least 21 years'
				});
			} else if (req.body.gender === 'Female'
				&& (dateTime.now() - parseInt(req.body.dob))
				/ (365.25 * 24 * 60 * 60 * 1000) < 18) {
				return res.status(200).send({
					state: 'failure',
					message: 'Age of male user must be at least 18 years'
				});
			}
			if (!req.body.height) {
				return res.status(200).send({
					state: 'failure',
					message: 'Height is required'
				});
			} else if (isNaN(parseFloat(req.body.height))) {
				return res.status(200).send({
					state: 'failure',
					message: 'Height is invalid'
				});
			}
			if (!req.body.weight) {
				return res.status(200).send({
					state: 'failure',
					message: 'Weight is required'
				});
			} else if (isNaN(parseFloat(req.body.weight))) {
				return res.status(200).send({
					state: 'failure',
					message: 'Weight is invalid'
				});
			}
			if (!req.body.district || req.body.district === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'District is required'
				});
			}
			if (!req.body.nationality || req.body.nationality === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Nationality is required'
				});
			}
			if (!req.body.password || req.body.password === '') {
				return res.status(200).send({
					state: 'failure',
					message: 'Password is required'
				});
			}
			if (!passRegex.test(req.body.password)) {
				return res.status(200).send({
					state: 'failure',
					message:
						'Password must include minimum 8' +
						' and maximum 50 characters, at least one uppercase letter,' +
						' one lowercase letter and one number'
				});
			}
			// if (!req.body.email || req.body.email === '') {
			// 	return res.status(200).send({
			// 		state: 'failure',
			// 		message: 'Email address is required'
			// 	});
			// }
			// if (!validate.emailExt(req.body.email)) {
			// 	return res.status(200).send({
			// 		state: 'failure',
			// 		message: 'Email address is invalid'
			// 	});
			// }
			User.findOne(
				{
					'identity.mobileNo': req.body.mobileNo
				},
				function (err, mobileUser) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					if (mobileUser) {
						return res.status(200).send({
							state: 'failure',
							message: 'Mobile number already registered'
						});
					}
					var newUser = new User();
					var details = 'User self registration';
					var appName = req.decoded.appKey.name;
					var appKey = req.decoded.appKey.token;
					var member_id = 'SELF';
					if (req.body.email) {
						User.findOne(
							{
								$or: [
									{'identity.email': req.body.email},
									{'identity.emailTemp': req.body.email}
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
								newUser.identity.fullname = req.body.fullname.toString().trim();
								newUser.profile.nickname = req.body.nickname.toString().trim();
								// newUser.profile.about = req.body.about.toString().trim();
								newUser.profile.relationshipStatus
									= req.body.relationshipStatus.toString().trim();
								newUser.info.gender = req.body.gender.toString().trim();
								newUser.info.religion = req.body.religion.toString().trim();
								newUser.info.bloodGroup = req.body.bloodGroup.toString().trim();
								newUser.info.dob = parseInt(req.body.dob);
								newUser.profile.height = parseFloat(req.body.height);
								newUser.profile.weight = parseFloat(req.body.weight);
								newUser.profile.district = req.body.district.toString().trim();
								newUser.profile.nationality = req.body.nationality.toString().trim();
								newUser.identity.mobileNo = req.body.mobileNo;
								newUser.identity.mobileNoVerified = true;
								newUser.identity.email = req.body.email;
								newUser.identity.emailVerified = false;
								newUser.identity.password = hash.create(req.body.password);
								newUser.created.dateTime = dateTime.now();
								newUser.created.member_id = 'SELF';
								newUser.created.memberType = 'User';

								// create log
								log
									.create(
										'create',
										details,
										'User',
										{},
										newUser,
										appName,
										appKey,
										member_id,
										'User'
									)
									.then(
										function (log) {
											newUser.created.log_id = log._id;
											newUser.save(function (err, savedUser) {
												if (err) {
													return res.status(500).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												}
												// Send Email Link
												// otp.send
												// 	.email(savedUser.identity.email, savedUser._id, 'User')
												// 	.then(
												// 		result => {
												// 			// eslint-disable-next-line no-console
												// 			console.log(result);
												// 		},
												// 		err => {
												// 			// eslint-disable-next-line no-console
												// 			console.error(err);
												// 		}
												// 	);
												// create token
												jwt.sign(
													{ _id: savedUser._id.toString() },
													jwtSecret.user.secret,
													{ expiresIn: jwtSecret.user.expiresIn },
													function (err, token) {
														if (err) {
															return res.status(500).send({
																state: 'failure',
																message: 'token generation failed',
																error: err
															});
														}
														// set notification token (if eligible) in background
														notification.setToken(
															savedUser._id,
															req.body.notificationToken,
															appName,
															appKey
														).then(function() {
															return res.status(200).send({
																state: 'success',
																message: 'Successfully signed up',
																token: token,
																user: parse.user(savedUser)
															});
														}, function(err) {
															return res.status(500).send({
																state: 'failure',
																message: 'database error',
																error: err
															});
														});
													}
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
							}
						);
					} else {
						newUser.identity.fullname = req.body.fullname.toString().trim();
						newUser.profile.nickname = req.body.nickname.toString().trim();
						// newUser.profile.about = req.body.about.toString().trim();
						newUser.profile.relationshipStatus
							= req.body.relationshipStatus.toString().trim();
						newUser.info.gender = req.body.gender.toString().trim();
						newUser.info.religion = req.body.religion.toString().trim();
						newUser.info.bloodGroup = req.body.bloodGroup.toString().trim();
						newUser.info.dob = parseInt(req.body.dob);
						newUser.profile.height = parseFloat(req.body.height);
						newUser.profile.weight = parseFloat(req.body.weight);
						newUser.profile.district = req.body.district.toString().trim();
						newUser.profile.nationality = req.body.nationality.toString().trim();
						newUser.identity.mobileNo = req.body.mobileNo;
						newUser.identity.mobileNoVerified = true;
						newUser.identity.password = hash.create(req.body.password);
						newUser.created.dateTime = dateTime.now();
						newUser.created.member_id = 'SELF';
						newUser.created.memberType = 'User';

						// create log
						log
							.create(
								'create',
								details,
								'User',
								{},
								newUser,
								appName,
								appKey,
								member_id,
								'User'
							)
							.then(
								function (log) {
									newUser.created.log_id = log._id;
									newUser.save(function (err, savedUser) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}
										// Send Email Link
										// otp.send
										// 	.email(savedUser.identity.email, savedUser._id, 'User')
										// 	.then(
										// 		result => {
										// 			// eslint-disable-next-line no-console
										// 			console.log(result);
										// 		},
										// 		err => {
										// 			// eslint-disable-next-line no-console
										// 			console.error(err);
										// 		}
										// 	);
										// create token
										jwt.sign(
											{ _id: savedUser._id.toString() },
											jwtSecret.user.secret,
											{ expiresIn: jwtSecret.user.expiresIn },
											function (err, token) {
												if (err) {
													return res.status(500).send({
														state: 'failure',
														message: 'token generation failed',
														error: err
													});
												}
												// set notification token (if eligible) in background
												notification.setToken(
													savedUser._id,
													req.body.notificationToken,
													appName,
													appKey
												).then(function() {
													return res.status(200).send({
														state: 'success',
														message: 'Successfully signed up',
														token: token,
														user: parse.user(savedUser)
													});
												}, function(err) {
													return res.status(500).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												});
											}
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
					}
				}
			);
		},
		function (err) {
			return res.status(err.error ? 500 : 200).send(err);
		}
	);
}

function verifyEmailByOTP(req, res) {
	// API Validation
	if (!req.body.token || req.body.token === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Token is required'
		});
	}
	otp.verify.user.email(req.body.token).then(
		function (result) {
			User.findById(result.otp.member_id, function (err, user) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (!user || !user.active) {
					return res.status(200).send({
						state: 'failure',
						// eslint-disable-next-line quotes
						message: 'User account doesn\'t exist'
					});
				}
				// collect data for log
				var oldDoc = Object.assign({}, user);
				// update user
				if (user.identity.emailVerified === false
					&& !user.identity.emailTemp) {
					user.identity.emailVerified = true;
				} else if (user.identity.emailVerified === false
					&& user.identity.emailTemp) {
					user.identity.emailVerified = true;
					user.identity.email = user.identity.emailTemp;
					user.identity.emailTemp = undefined;
				} else if (user.identity.emailVerified === true
					&& user.identity.emailTemp) {
					user.identity.email = user.identity.emailTemp;
					user.identity.emailTemp = undefined;
				}
				// finalize log
				var newDoc = Object.assign({}, user);
				var details = 'User email verified';
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = user._id;
				// send log
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
					.then(function (log) {
						user.updates.push({
							dateTime: dateTime.now(),
							member_id: 'SELF',
							memberType: 'User',
							log_id: log._id
						});
						// eslint-disable-next-line no-unused-vars
						user.save(function (err, updatedUser) {
							if (err) {
								return res.status(500).send({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							return res.status(200).send({
								state: 'success',
								message: 'Email verified'
							});
						});
					});
			});
		},
		err => res.status(err.error ? 500 : 200).send(err)
	);
}

module.exports = {
	login,
	checkMobile,
	checkEmail,
	sendMobileOTP,
	verifyMobileOTP,
	verifyEmailByOTP,
	resetByMobileOTP,
	signupByMobileOTP
};
