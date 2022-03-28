var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var fbAdmin = require('firebase-admin');
var log = require('./log');
var dateTime = require('./dateTime');

var User = mongoose.model('User');

function setToken(id, token, appName, appKey) {
	return new Promise(function(resolve, reject) {
		User.findById(id, function (err, user) {
			if (err) {
				return reject(err);
			} else if (!user) {
				return reject({ message: 'USER NOT FOUND' });
			} else {
				var oldDoc = Object.assign({}, user);
				user.notificationToken = token;
				var newDoc = Object.assign({}, user);
				var details = 'User device notification token set';
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
									return reject(err);
								} else {
									return resolve();
								}
							});
						},
						function (err) {
							return reject(err);
						}
					);
			}
		});
	});
}

function removeToken(id, appName, appKey) {
	User.findById(id, function (err, user) {
		if (err) {
			// eslint-disable-next-line no-console
			console.error(err);
		} else if (!user) {
			// eslint-disable-next-line no-console
			console.error('USER NOT FOUND');
		} else {
			var oldDoc = Object.assign({}, user);
			user.notificationToken = undefined;
			var newDoc = Object.assign({}, user);
			var details = 'User device notification token removed';
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
								// eslint-disable-next-line no-console
								console.error(err);
							} else {
								// eslint-disable-next-line no-console
								console.log('User device notification token removed');
							}
						});
					},
					function (err) {
						// eslint-disable-next-line no-console
						console.error(err);
					}
				);
		}
	});
}

// mode = ['token', 'topic', 'condition']
function send(
	title = '',
	message = '',
	data = {},
	destination = '',
	mode = 'token'
) {
	return new Promise(function (resolve, reject) {
		var option = {};
		// check for notification
		if (title !== '' && message !== '') {
			option.notification = {
				title: title,
				body: message
			};
		}
		// check for data
		if (data !== {}) {
			option.data = data;
		}
		// check for destination
		if (destination !== '') {
			option[mode] = destination;
		}

		// validation
		if (!option.notification && !option.data) {
			return reject('Either notification or data is required');
		} else if (!option.token && !option.topic && !option.condition) {
			return reject('Destination is required');
		}

		// send
		fbAdmin
			.messaging()
			.send(option)
			.then(function (response) {
				return resolve(response);
			})
			.catch(function (err) {
				return reject(JSON.stringify(err));
			});
	});
}

module.exports = {
	setToken: setToken,
	removeToken: removeToken,
	send: send
};
