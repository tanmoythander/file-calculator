var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var role = require('./../../../components/role');
var log = require('./../../../components/log');
// var notification = require('./../../../components/notification');
var dateTime = require('./../../../components/dateTime');

// Models
var SuperAdmin = mongoose.model('SuperAdmin');

// Functions
function getMaintenanceStatus(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'System', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	SuperAdmin.findOne({}, function (err, superAdmin) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = 'Read maintenance status';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'read',
				details,
				'System',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			// eslint-disable-next-line
			.then(
				function () {},
				err => console.err(err)
			);
		return res.status(200).send({
			state: 'success',
			message: 'Returned maintenance status',
			maintenance: superAdmin.config.maintenance
		});
	});
}

function setMaintenanceStatus(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'System', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	SuperAdmin.findOne({}, function (err, superAdmin) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (
			req.body.status &&
			req.body.status === true &&
			superAdmin.config.maintenance === true
		) {
			return res.status(200).send({
				state: 'failure',
				message: 'Maintenance mode already active',
				maintenance: superAdmin.config.maintenance
			});
		} else if (
			(!req.body.status || req.body.status === false) &&
			superAdmin.config.maintenance === false
		) {
			return res.status(200).send({
				state: 'failure',
				message: 'Maintenance mode already inactive',
				maintenance: superAdmin.config.maintenance
			});
		}
		superAdmin.config.maintenance = req.body.status && req.body.status === true;
		// create log
		var details = `${
			superAdmin.config.maintenance ? 'Activated' : 'Deactivated'
		} maintenance mode`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'update',
				details,
				'UserProduct',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (sLog) {
					superAdmin.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: sLog._id
					});
					superAdmin.save(function (err, savedSuperAdmin) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}

						return res.status(200).send({
							state: 'success',
							message: 'Set maintenance status',
							maintenance: savedSuperAdmin.config.maintenance
						});

						// notification.send(
						// 	(savedSuperAdmin.config.maintenance
						// 		? 'Maintenance Alert' : 'Service Resumed')
						// 		+ (process.env.PRODUCTION ? '' : ' (Dev)'),
						// 	(savedSuperAdmin.config.maintenance
						// 		? 'Server has entered into maintenance mode and will come back soon.'
						// 		: 'All services are back online. Thank you for your patience.')
						// 		+ '\n\nIf you feel disturbed, login to Green Delta App, go '
						// 		+ 'to "Notifications", then in the settings (⚙) turn off "Notice"',
						// 	{}, 'Notice', 'topic'
						// ).then(function() {
						// 	return res.status(200).send({
						// 		state: 'success',
						// 		message: 'Set maintenance status and '
						// 			+ 'notified "Notice" subscribed apps',
						// 		maintenance: savedSuperAdmin.config.maintenance
						// 	});
						// }, function(err) {
						// 	// eslint-disable-next-line no-console
						// 	return res.status(200).send({
						// 		state: 'success',
						// 		message: 'Set maintenance status but '
						// 			+ 'failed notifying "Notice" subscribed apps',
						// 		maintenance: savedSuperAdmin.config.maintenance,
						// 		error: err
						// 	});
						// });
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

module.exports = {
	getMaintenanceStatus,
	setMaintenanceStatus
};
