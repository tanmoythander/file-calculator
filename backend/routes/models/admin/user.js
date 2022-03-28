var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');
var log = require('./../../../components/log');
var parse = require('./../../../components/parse');
var dateTime = require('./../../../components/dateTime');

// Models
var User = mongoose.model('User');

// Functions
function getAll(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'User', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = User.find({}, function (err, users) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${users.length}) users`;
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
				'User',
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
			message: 'Returned all users',
			users: users.map(item => parse.user(item))
		});
	});
	query.sort('-created.dateTime');
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function search(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'User', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}

	// Defaults
	var queryString = req.body.query ? req.body.query.toString() : '';
	var itemsPerPage =
		req.body.pagination &&
		req.body.pagination.itemsPerPage &&
		!isNaN(parseInt(req.body.pagination.itemsPerPage))
			? parseInt(req.body.pagination.itemsPerPage)
			: 50;
	var pageIndex =
		req.body.pagination &&
		req.body.pagination.pageIndex &&
		!isNaN(parseInt(req.body.pagination.pageIndex))
			? parseInt(req.body.pagination.pageIndex)
			: 1;

	// Corrections
	if (itemsPerPage < 5) {
		itemsPerPage = 5;
	} else if (itemsPerPage > 500) {
		itemsPerPage = 500;
	}
	if (pageIndex < 1) {
		pageIndex = 1;
	}

	// Query
	var query = User.find(
		{
			$or: [
				{
					fullname: new RegExp(queryString, 'i')
				},
				{
					mobileNo: new RegExp(queryString, 'i')
				},
				{
					email: new RegExp(queryString, 'i')
				},
				{
					nid: new RegExp(queryString, 'i')
				}
			]
		},
		function (err, users) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			// process pagination
			var totalItems = users.length;
			var totalPages = Math.ceil(totalItems / itemsPerPage);
			if (pageIndex > totalPages) {
				pageIndex = totalPages;
			}
			var cursorIndex = (pageIndex - 1) * itemsPerPage;
			var currentItems = users.slice(cursorIndex, cursorIndex + itemsPerPage);

			// create log
			var details = `Read ${cursorIndex + 1}-${
				cursorIndex + currentItems.length
			} of ${totalItems} found users with query, <${queryString}>`;
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
					'User',
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
				message: 'Returned users',
				pagination: {
					totalItems: totalItems,
					itemsPerPage: itemsPerPage,
					totalPages: totalPages,
					pageIndex: pageIndex
				},
				users: currentItems.map(item => parse.user(item))
			});
		}
	);
	query.sort(
		req.body.oldestFirst && req.body.oldestFirst === true
			? 'created.dateTime'
			: '-created.dateTime'
	);
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function get(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'User', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	User.findById(req.params.id, function (err, user) {
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
				message: 'User not found'
			});
		}
		// create log
		var details = `Read user (_id: ${req.params.id})`;
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
				'User',
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
			message: 'Returned user',
			user: parse.user(user)
		});
	});
}

function deactivate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'User', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	User.findById(req.params.id, function (err, user) {
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
				message: 'User not found'
			});
		}
		if (!user.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'User is already deactivated',
				user: parse.user(user)
			});
		}
		// create log
		var details = `Deactivated user (_id: ${req.params.id})`;
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
				'User',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (uLog) {
					user.active = false;
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
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
							message: 'User deactivated successfully',
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

function activate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'User', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	User.findById(req.params.id, function (err, user) {
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
				message: 'User not found'
			});
		}
		if (user.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'User is already activated',
				user: parse.user(user)
			});
		}
		// create log
		var details = `Activated user (_id: ${req.params.id})`;
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
				'User',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (uLog) {
					user.active = true;
					user.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
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
							message: 'User activated successfully',
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

module.exports = {
	getAll,
	get,
	search,
	deactivate,
	activate
};
