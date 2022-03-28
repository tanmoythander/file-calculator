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
var sAdmin = require('./../../../secrets/superAdmin');

// Models
var SuperAdmin = mongoose.model('SuperAdmin');
var Admin = mongoose.model('Admin');

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
	if (!req.body.password || req.body.password === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Password is required'
		});
	}
	if (sAdmin.username === req.body.username) {
		SuperAdmin.findOne(
			{
				username: req.body.username
			},
			function (err, superAdmin) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (!superAdmin) {
					return res.status(200).send({
						state: 'failure',
						message: 'username not found'
					});
				}
				if (sAdmin.password !== req.body.password) {
					return res.status(200).send({
						state: 'failure',
						message: 'Incorrect password'
					});
				}
				jwt.sign(
					{ _id: superAdmin._id.toString() },
					jwtSecret.superAdmin.secret,
					{ expiresIn: jwtSecret.superAdmin.expiresIn },
					function (err, token) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'token generation failed',
								error: err
							});
						}
						var details = 'SuperAdmin logged in with credentials';
						var appName = req.decoded.appKey.name;
						var appKey = req.decoded.appKey.token;
						var member_id = superAdmin._id;
						log
							.create(
								'read',
								details,
								'SuperAdmin',
								{},
								{},
								appName,
								appKey,
								member_id,
								'SuperAdmin'
							)
							.then(
							// eslint-disable-next-line
								function (log) {},
								// eslint-disable-next-line no-console
								err => console.err(err)
							);
						return res.status(200).send({
							state: 'success',
							message: 'Successfully logged in',
							token: token,
							superAdmin: parse.admin(superAdmin)
						});
					}
				);
			}
		);
	} else {
		if (!validate.emailExt(req.body.username)) {
			return res.status(200).send({
				state: 'failure',
				message: 'Username is invalid'
			});
		}
		Admin.findOne(
			{
				email: req.body.username,
				active: true
			},
			function (err, admin) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (!admin) {
					return res.status(200).send({
						state: 'failure',
						message: 'Admin account doesn\'t exist'
					});
				}
				if (!admin.emailVerified) {
					return res.status(200).send({
						state: 'failure',
						message: 'Admin account not verified'
					});
				}
				if (!hash.inSync(admin.password, req.body.password)) {
					return res.status(200).send({
						state: 'failure',
						message: 'Incorrect password'
					});
				}
				jwt.sign(
					{ _id: admin._id.toString() },
					jwtSecret.admin.secret,
					{ expiresIn: jwtSecret.admin.expiresIn },
					function (err, token) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'token generation failed',
								error: err
							});
						}
						var details = 'Admin logged in with credentials';
						var appName = req.decoded.appKey.name;
						var appKey = req.decoded.appKey.token;
						var member_id = admin._id;
						log
							.create(
								'read',
								details,
								'Admin',
								{},
								{},
								appName,
								appKey,
								member_id,
								'Admin'
							)
							// eslint-disable-next-line
							.then(
								function (log) {},
								err => console.err(err)
							);
						return res.status(200).send({
							state: 'success',
							message: 'Successfully logged in',
							token: token,
							admin: parse.admin(admin)
						});
					}
				);
			}
		);
	}
}

function sendOTP(req, res) {
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
	Admin.findOne(
		{
			email: req.body.email,
			active: true
		},
		function (err, admin) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!admin) {
				return res.status(200).send({
					state: 'failure',
					message: "Admin account doesn't exist"
				});
			}
			otp.send.email(req.body.email, admin._id, 'Admin').then(
				function (result) {
					// create log
					var oldDoc = Object.assign({}, admin);
					var newDoc = {};
					var details = 'Someone requested Admin OTP verification email';
					var appName = req.decoded.appKey.name;
					var appKey = req.decoded.appKey.token;
					var member_id = 'UNKNOWN';
					log
						.create(
							'create',
							details,
							'Email',
							oldDoc,
							newDoc,
							appName,
							appKey,
							member_id,
							'Admin'
						)
						// eslint-disable-next-line no-unused-vars
						.then(
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
	);
}

function verifyOTP(req, res) {
	// API Validation
	if (!req.body.token || req.body.token === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Token is required'
		});
	}
	otp.verify.admin(req.body.token, false).then(
		result => res.status(200).send(result),
		err => res.status(err.error ? 500 : 200).send(err)
	);
}

function resetByOTP(req, res) {
	// API Validation
	if (!req.body.token || req.body.token === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Token is required'
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
	otp.verify.admin(req.body.token, true).then(
		function (result) {
			// return res.status(200).send(result);
			Admin.findById(result.otp.member_id, function (err, admin) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (!admin || !admin.active) {
					return res.status(200).send({
						state: 'failure',
						message: "Admin account doesn't exist"
					});
				}
				var now = dateTime.now();
				// collect data for log
				var oldDoc = Object.assign({}, admin);
				var newDoc = Object.assign({}, admin);
				newDoc.password = hash.create(req.body.password);
				newDoc.emailVerified = true;
				var details = 'Admin password reset';
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = admin._id;
				// send log
				log
					.create(
						'update',
						details,
						'Admin',
						oldDoc,
						newDoc,
						appName,
						appKey,
						member_id,
						'Admin'
					)
					.then(
						function (log) {
							// update admin, emailVerified: true, newPassword
							admin.password = hash.create(req.body.password);
							admin.emailVerified = true;
							admin.updates.push({
								dateTime: dateTime.now(),
								member_id: 'SELF',
								memberType: 'Admin',
								log_id: log._id
							});
							admin.save(function (err, updatedAdmin) {
								if (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								// create token
								jwt.sign(
									{ _id: updatedAdmin._id.toString() },
									jwtSecret.admin.secret,
									{ expiresIn: jwtSecret.admin.expiresIn },
									function (err, token) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'token generation failed',
												error: err
											});
										}
										return res.status(200).send({
											state: 'success',
											message: 'Successfully reset password',
											token: token,
											admin: parse.admin(updatedAdmin)
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
			});
		},
		function (err) {
			return res.status(err.error ? 500 : 200).send(err);
		}
	);
}

module.exports = {
	login,
	sendOTP,
	verifyOTP,
	resetByOTP
};
