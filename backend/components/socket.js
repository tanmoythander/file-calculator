/* eslint-disable no-console */
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var log = require('./log');
var dateTime = require('./dateTime');

var User = mongoose.model('User');

function setId(id, socketId, appName, appKey) {
	User.findById(id, function (err, user) {
		if (err) {
			console.error(err);
		} else if (!user) {
			console.error('USER NOT FOUND');
		} else {
			var oldDoc = Object.assign({}, user);
			user.socketId = socketId;
			var newDoc = Object.assign({}, user);
			var details = 'User socket connection established';
			log
				.create(
					'update',
					details,
					'User',
					oldDoc,
					newDoc,
					appName,
					appKey,
					id.toString(),
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
						// eslint-disable-next-line no-unused-vars
						user.save(function (err, savedUser) {
							if (err) {
								console.error(err);
							} else {
								console.log('User socket connection established');
							}
						});
					},
					function (err) {
						console.error(err);
					}
				);
		}
	});
}

function removeId(id, appName, appKey) {
	User.findById(id, function (err, user) {
		if (err) {
			console.error(err);
		} else if (!user) {
			console.error('USER NOT FOUND');
		} else {
			var oldDoc = Object.assign({}, user);
			user.socketId = undefined;
			var newDoc = Object.assign({}, user);
			var details = 'User socket connection disabled';
			log
				.create(
					'update',
					details,
					'User',
					oldDoc,
					newDoc,
					appName,
					appKey,
					id.toString(),
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
						// eslint-disable-next-line no-unused-vars
						user.save(function (err, savedUser) {
							if (err) {
								console.error(err);
							} else {
								console.log('User socket connection disabled');
							}
						});
					},
					function (err) {
						console.error(err);
					}
				);
		}
	});
}

function disableId(id, socketId, appName, appKey) {
	User.findById(id, function (err, user) {
		if (err) {
			console.error(err);
		} else if (!user) {
			console.error('USER NOT FOUND');
		} else if (user.socketId !== socketId) {
			console.log('Skipping disabling socket ID');
		} else {
			var oldDoc = Object.assign({}, user);
			user.socketId = undefined;
			var newDoc = Object.assign({}, user);
			var details = 'User socket connection disabled';
			log
				.create(
					'update',
					details,
					'User',
					oldDoc,
					newDoc,
					appName,
					appKey,
					id.toString(),
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
						// eslint-disable-next-line no-unused-vars
						user.save(function (err, savedUser) {
							if (err) {
								console.error(err);
							} else {
								console.log('User socket connection disabled');
							}
						});
					},
					function (err) {
						console.error(err);
					}
				);
		}
	});
}

module.exports = {
	setId: setId,
	removeId: removeId,
	disableId: disableId
};
