var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var jwt = require('jsonwebtoken');
var parse = require('./parse');
var jwtSecret = require('./../secrets/jwt');
var sAdmin = require('./../secrets/superAdmin');

// Models
var Admin = mongoose.model('Admin');
var SuperAdmin = mongoose.model('SuperAdmin');
var User = mongoose.model('User');

// Verify App Key
function verifyApp(req, res, next) {
	var token = req.headers['app-key'];

	// decode token
	if (token) {
		// verifies secret
		var appKey = sAdmin.appKeys.find(function (item) {
			return item.token === token;
		});

		if (appKey) {
			req.decoded = {};
			req.decoded.appKey = appKey;
			// log IP address and timestamp
			message = 'Verified access from '
				+ req.headers['x-forwarded-for'] + ' at '
				+ (new Date()).toLocaleString();
			// eslint-disable-next-line no-console
			console.info(message);
			return next();
		} else {
			// log IP address and timestamp
			message = 'Revoked access from '
				+ req.headers['x-forwarded-for'] + ' at '
				+ (new Date()).toLocaleString();
			// eslint-disable-next-line no-console
			console.warn(message);
			return res.status(403).send({
				state: 'failure',
				message: 'App authorization invalid'
			});
		}
	} else {
		return res.status(403).send({
			state: 'failure',
			message: 'App authorization is required'
		});
	}
}

// Verify User App
// User app authenticator middleware
var verifyUserApp = function (req, res, next) {
	if (
		req.decoded &&
		req.decoded.appKey &&
		(req.decoded.appKey.name === 'BUTTERFLY-POSTMAN' || // postman support
			req.decoded.appKey.name === 'BUTTERFLY-WEB' ||
			req.decoded.appKey.name === 'BUTTERFLY-MOBILE-IOS' ||
			req.decoded.appKey.name === 'BUTTERFLY-MOBILE-ANDROID')
	) {
		return next();
	}
	return res.status(403).send({
		state: 'failure',
		message: 'User API access not permitted'
	});
};

// Verify Admin App
// Admin app authenticator middleware
var verifyAdminApp = function (req, res, next) {
	if (
		req.decoded &&
		req.decoded.appKey &&
		(req.decoded.appKey.name === 'BUTTERFLY-POSTMAN' || // postman support
			req.decoded.appKey.name === 'BUTTERFLY-ADMIN')
	) {
		return next();
	}
	return res.status(403).send({
		state: 'failure',
		message: 'Admin API access not permitted'
	});
};

// Verify Admin Authentication
function verifyAdmin(req, res, next) {
	var adminToken = req.headers['admin-key'];
	var superAdminToken = req.headers['super-admin-key'];

	// decode token
	if (superAdminToken && superAdminToken.length > 10) {
		// verifies secret and checks exp
		jwt.verify(
			superAdminToken,
			jwtSecret.superAdmin.secret,
			function (err, decoded) {
				if (err) {
					return res.status(400).send({
						state: 'failure',
						message: 'Token is dead'
					});
				}
				SuperAdmin.findOne(
					{
						_id: mongoose.Types.ObjectId(decoded._id)
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
							return res.status(400).send({
								state: 'failure',
								message: 'Super Admin not found'
							});
						}
						superAdmin.password = undefined;
						// everything is good, save to request for use in target route
						req.decoded._doc = decoded._doc;
						req.decoded.superAdmin = superAdmin;
						return next();
					}
				);
			}
		);
	} else if (adminToken && adminToken.length > 10) {
		// verifies secret and checks exp
		jwt.verify(adminToken, jwtSecret.admin.secret, function (err, decoded) {
			if (err) {
				return res.status(400).send({
					state: 'failure',
					message: 'Token is dead'
				});
			}
			Admin.findOne(
				{
					_id: mongoose.Types.ObjectId(decoded._id),
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
						return res.status(400).send({
							state: 'failure',
							message: 'Admin not found'
						});
					}
					// everything is good, save to request for use in target route
					req.decoded._doc = decoded._doc;
					req.decoded.admin = parse.admin(admin);
					return next();
				}
			);
		});
	} else {
		return res.status(400).send({
			state: 'failure',
			message: 'No token provided'
		});
	}
}

// Verify User Authentication
function verifyUser(req, res, next) {
	var token = req.headers['user-key'];
	var instanceToken = req.headers['instance-key'];

	// decode token
	if (token && instanceToken) {
		// verifies secret and checks exp
		jwt.verify(token, jwtSecret.user.secret, function (err, decoded) {
			if (err) {
				return res.status(400).send({
					state: 'failure',
					message: 'Token is dead'
				});
			}
			User.findOne(
				{
					_id: mongoose.Types.ObjectId(decoded._id),
					active: true
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
						return res.status(400).send({
							state: 'failure',
							message: 'User not found'
						});
					}
					if (!user.notificationToken) {
						return res.status(400).send({
							state: 'failure',
							message: 'User not logged in'
						});
					}
					if (user.notificationToken !== instanceToken) {
						return res.status(400).send({
							state: 'failure',
							message: 'Invalid instance token'
						});
					}
					// everything is good, save to request for use in other routes
					req.decoded._doc = decoded._doc;
					req.decoded.user = user;
					return next();
				}
			);
		});
	} else {
		return res.status(400).send({
			state: 'failure',
			message: 'No token provided'
		});
	}
}

// Verify User Socket Authentication
function verifyUserSocket(socket, next) {
	if (!socket.handshake.query.userKey || !socket.handshake.query.appKey) {
		return next(new Error(
			'Socket authentication keys are missing'));
	}
	const appKey = socket.handshake.query.appKey.toString();
	const userKey = socket.handshake.query.userKey.toString();
	const instanceKey = socket.handshake.query.instanceKey.toString();
	const appKeyObj = sAdmin.appKeys.find(function (item) {
		return item.token === appKey;
	});
	if (!appKeyObj) {
		return next(new Error(
			'Socket authentication keys are invalid'));
	}
	if (appKeyObj.name !== 'BUTTERFLY-POSTMAN'
		&& appKeyObj.name !== 'BUTTERFLY-WEB'
		&& appKeyObj.name !== 'BUTTERFLY-MOBILE-ANDROID'
		&& appKeyObj.name !== 'BUTTERFLY-MOBILE-IOS') {
		return next(new Error(
			'Socket connection is not permitted'));
	}
	jwt.verify(userKey, jwtSecret.user.secret, function(err, decoded) {
		if (err) {
			return next(new Error(
				'Socket authentication keys are invalid'));
		}
		User.findOne({
			'_id': mongoose.Types.ObjectId(decoded._id),
			'active': true
		}, function(err, user) {
			if (err) {
				return next(new Error(
					'Socket authentication error at database'));
			}
			if (!user) {
				return next(new Error(
					'Socket authentication rejected due to user inactivity'));
			}
			if (!user.notificationToken) {
				return next(new Error(
					'User not logged in'));
			}
			if (user.notificationToken !== instanceKey) {
				return next(new Error(
					'Invalid instance token'));
			}
			socket.decoded = {
				user: user,
				appKey: appKeyObj
			};
			return next();
		});
	});
}

module.exports = {
	verifyApp: verifyApp,
	verifyUserApp: verifyUserApp,
	verifyAdminApp: verifyAdminApp,
	verifyUser: verifyUser,
	verifyAdmin: verifyAdmin,
	verifyUserSocket: verifyUserSocket
};
