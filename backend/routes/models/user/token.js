var jwt = require('jsonwebtoken');
var jwtSecret = require('./../../../secrets/jwt');
var parse = require('./../../../components/parse');
var log = require('./../../../components/log');
var dateTime = require('./../../../components/dateTime');

function reset(req, res) {
	jwt.sign(
		{ _id: req.decoded.user._id.toString() },
		jwtSecret.user.secret,
		{ expiresIn: jwtSecret.user.expiresIn },
		function (err, token) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'Token generation failed',
					error: err
				});
			}
			var details = 'User token reset';
			var appName = req.decoded.appKey.name;
			var appKey = req.decoded.appKey.token;
			var member_id = req.decoded.user._id;
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
				.then(
					// eslint-disable-next-line
					function (log) {},
					// eslint-disable-next-line
					err => console.err(err)
				);
			return res.status(200).send({
				state: 'success',
				message: 'Token reset successful',
				token: token,
				user: parse.user(req.decoded.user)
			});
		}
	);
}

function logout(req, res) {
	var user = req.decoded.user;
	var dateTimeNow = dateTime.now();
	var oldDoc = Object.assign({}, user);
	user.notificationToken = undefined;
	user.socketId = undefined;
	var newDoc = Object.assign({}, user);
	var details = 'User logged out';
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
		.then(function (uLog) {
			user.updates.push({
				dateTime: dateTimeNow,
				member_id: user._id,
				memberType: 'User',
				log_id: uLog._id
			});
			user.save(function(err, sUser) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				return res.status(200).send({
					state: 'success',
					message: 'Successfully logged out',
					user: parse.user(sUser)
				});
			});
		}, function(err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		});
}

module.exports = {
	reset, logout
};
