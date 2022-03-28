var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');
var log = require('./../../../components/log');
var parse = require('./../../../components/parse');
var otp = require('./../../../components/otp');
var validate = require('./../../../components/validate');
var dateTime = require('./../../../components/dateTime');
var sAdmin = require('./../../../secrets/superAdmin');

// Models
var Admin = mongoose.model('Admin');

// Functions
function getAllRoles(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	return res.status(200).send({
		state: 'success',
		message: 'Returned all available roles',
		roles: sAdmin.collections
	});
}

function createAnAdmin(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	// validation
	if (!req.body.name || req.body.name === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Name is required'
		});
	}
	if (!req.body.email || req.body.email === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Email is required'
		});
	}
	if (!validate.emailExt(req.body.email)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid email address'
		});
	}
	if (process.env.PRODUCTION
		&& !/@butterflymatrimonial.com\s*$/.test(req.body.email)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Email domain must be butterflymatrimonial.com'
		});
	}
	if (
		!process.env.PRODUCTION
		&& !/@quanticdynamics.com\s*$/.test(req.body.email)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Email domain must be quanticdynamics.com'
		});
	}
	if (!req.body.department || req.body.department === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Department is required'
		});
	}
	if (!req.body.designation || req.body.designation === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Designation is required'
		});
	}
	if (!req.body.roles) {
		return res.status(200).send({
			state: 'failure',
			message: 'Roles are required'
		});
	}
	if (!Array.isArray(req.body.roles)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Roles must be an array'
		});
	}
	Admin.findOne(
		{
			email: req.body.email
		},
		function (err, exstAdmin) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (exstAdmin) {
				return res.status(200).send({
					state: 'failure',
					message: 'Email already registered'
				});
			}
			var newAdmin = new Admin();
			newAdmin.fullname = req.body.name;
			newAdmin.email = req.body.email;
			newAdmin.department = req.body.department;
			newAdmin.designation = req.body.designation;
			// analyse roles
			req.body.roles.forEach(function (item) {
				if (item.collectionName && item.access) {
					var role = sAdmin.collections.find(function (mItem) {
						return mItem.name === item.collectionName;
					});
					if (role && role.accesses.indexOf(item.access) > -1) {
						newAdmin.roles.push(item);
					}
				}
			});
			// create log
			var details = 'Admin registration';
			var appName = req.decoded.appKey.name;
			var appKey = req.decoded.appKey.token;
			var member_id = req.decoded.admin
				? req.decoded.admin._id
				: req.decoded.superAdmin._id;
			var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
			log
				.create(
					'create',
					details,
					'Admin',
					{},
					newAdmin,
					appName,
					appKey,
					member_id,
					memberType
				)
				// eslint-disable-next-line no-unused-vars
				.then(
					function (aLog) {
						newAdmin.created.dateTime = dateTime.now();
						newAdmin.created.member_id = member_id;
						newAdmin.created.memberType = memberType;
						newAdmin.created.log_id = aLog._id;
						// save the admin
						newAdmin.save(function (err, admin) {
							if (err) {
								return res.status(500).send({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							// Send Email Link
							otp.send.email(admin.email, admin._id, 'Admin').then(
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
		}
	);
}

function searchAdmins(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'r')) {
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
	var query = Admin.find(
		{
			$or: [
				{
					fullname: new RegExp(queryString, 'i')
				},
				{
					email: new RegExp(queryString, 'i')
				},
				{
					department: new RegExp(queryString, 'i')
				},
				{
					designation: new RegExp(queryString, 'i')
				}
			]
		},
		function (err, admins) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			// process pagination
			var totalItems = admins.length;
			var totalPages = Math.ceil(totalItems / itemsPerPage);
			if (pageIndex > totalPages) {
				pageIndex = totalPages;
			}
			var cursorIndex = (pageIndex - 1) * itemsPerPage;
			var currentItems = admins.slice(cursorIndex, cursorIndex + itemsPerPage);

			// create log
			var details = `Read ${cursorIndex + 1}-${
				cursorIndex + currentItems.length
			} of ${totalItems} found admins with query, <${queryString}>`;
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
					'Admin',
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
				message: 'Returned admins',
				pagination: {
					totalItems: totalItems,
					itemsPerPage: itemsPerPage,
					totalPages: totalPages,
					pageIndex: pageIndex
				},
				admins: currentItems.map(item => parse.admin(item))
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

function getAllAdmins(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = Admin.find({}, function (err, admins) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${admins.length}) admins`;
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
				'Admin',
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
			message: 'Returned all admins',
			admins: admins.map(item => parse.admin(item))
		});
	});
	query.sort('-created.dateTime');
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function getAnAdmin(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Admin.findById(req.params.id, function (err, admin) {
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
				message: 'Admin not found'
			});
		}
		// create log
		var details = `Read admin (_id: ${req.params.id})`;
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
				'Admin',
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
			message: 'Returned admin',
			admin: parse.admin(admin)
		});
	});
}

function updateAnAdmin(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	// validation
	if (
		req.decoded.admin &&
		req.params.id.toString() === req.decoded.admin._id.toString()
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Self update is not allowed'
		});
	}
	// validation
	if (
		!req.body.name &&
		!req.body.department &&
		!req.body.designation &&
		!req.body.roles
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Nothing to update'
		});
	}
	if (req.body.roles && !Array.isArray(req.body.roles)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Roles must be an array'
		});
	}
	Admin.findById(req.params.id, function (err, admin) {
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
				message: 'Admin not found'
			});
		}
		var oldDoc = Object.assign({}, admin);
		if (req.body.name) {
			admin.fullname = req.body.name;
		}
		if (req.body.department) {
			admin.department = req.body.department;
		}
		if (req.body.designation) {
			admin.designation = req.body.designation;
		}
		if (req.body.roles) {
			admin.roles = [];
			// analyse roles
			req.body.roles.forEach(function (item) {
				if (item.collectionName && item.access) {
					var role = sAdmin.collections.find(function (mItem) {
						return mItem.name === item.collectionName;
					});
					if (role && role.accesses.indexOf(item.access) > -1) {
						admin.roles.push(item);
					}
				}
			});
		}

		// create log
		var newDoc = Object.assign({}, admin);
		var details = `Updated admin (_id: ${req.params.id})`;
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
				'Admin',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				memberType
			)
			// eslint-disable-next-line
			.then(
				function (mLog) {
					admin.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: mLog._id
					});
					admin.save(function (err, savedAdmin) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Admin upddated successfully',
							admin: parse.admin(savedAdmin)
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

function deactivateAnAdmin(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	// validation
	if (
		req.decoded.admin &&
		req.params.id.toString() === req.decoded.admin._id.toString()
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Self deactivation is not allowed'
		});
	}
	Admin.findById(req.params.id, function (err, admin) {
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
				message: 'Admin not found'
			});
		}
		if (!admin.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Admin is already deactivated',
				admin: parse.admin(admin)
			});
		}
		// create log
		var details = `Deactivated admin (_id: ${req.params.id})`;
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
				'Admin',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (mLog) {
					admin.active = false;
					admin.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: mLog._id
					});
					admin.save(function (err, savedAdmin) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Admin deactivated successfully',
							admin: parse.admin(savedAdmin)
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

function activateAnAdmin(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Admin', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Admin.findById(req.params.id, function (err, admin) {
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
				message: 'Admin not found'
			});
		}
		if (admin.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Admin is already activated',
				admin: parse.admin(admin)
			});
		}
		// create log
		var details = `Activated admin (_id: ${req.params.id})`;
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
				'Admin',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (mLog) {
					admin.active = true;
					admin.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: mLog._id
					});
					admin.save(function (err, savedAdmin) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Admin activated successfully',
							admin: parse.admin(savedAdmin)
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
	role: {
		getAll: getAllRoles
	},
	admin: {
		create: createAnAdmin,
		search: searchAdmins,
		getAll: getAllAdmins,
		get: getAnAdmin,
		update: updateAnAdmin,
		deactivate: deactivateAnAdmin,
		activate: activateAnAdmin
	}
};
