var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');

// Models
var ProfileParam = mongoose.model('ProfileParam');

// Functions
function create(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'ProfileParam', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	// validation
	if (!req.body.paramName) {
		return res.status(200).send({
			state: 'failure',
			message: 'paramName is required'
		});
	}
	ProfileParam.findOne(
		{
			paramName: req.body.paramName.toString().trim(),
			active: true
		},
		function (err, exstProfileParam) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			// exists already
			if (exstProfileParam) {
				return res.status(200).send({
					state: 'failure',
					message:
						req.body.paramName.toString().trim() + ', parameter already exists'
				});
			}
			// create new
			var newProfileParam = new ProfileParam();
			newProfileParam.paramName = req.body.paramName.toString().trim();
			if (req.body.paramRequired) {
				newProfileParam.paramRequired = req.body.paramRequired;
			} else {
				newProfileParam.paramRequired = false;
			}
			if (req.body.paramType) {
				newProfileParam.paramType = req.body.paramType.toString().trim();
				if (
					newProfileParam.paramType === 'string' &&
					req.body.paramMinLen &&
					!isNaN(req.body.paramMinLen) &&
					req.body.paramMinLen > 0 &&
					req.body.paramMaxLen &&
					!isNaN(req.body.paramMaxLen) &&
					req.body.paramMaxLen > 0
				) {
					// String with max min values
					newProfileParam.paramMinLen = req.body.paramMinLen;
					newProfileParam.paramMaxLen = req.body.paramMaxLen;
				} else if (
					newProfileParam.paramType === 'string' &&
					req.body.paramEnums
				) {
					// String with enum values
					newProfileParam.paramEnums = req.body.paramEnums.map(function (item) {
						return item.toString().trim();
					});
				} else if (
					newProfileParam.paramType === 'number' &&
					req.body.paramMin &&
					!isNaN(req.body.paramMin) &&
					req.body.paramMin > 0 &&
					req.body.paramMax &&
					!isNaN(req.body.paramMax) &&
					req.body.paramMax > 0
				) {
					// Number with max min values
					newProfileParam.paramMin = req.body.paramMin;
					newProfileParam.paramMax = req.body.paramMax;
				}
			}
			// create log
			var details = 'Created profileParam';
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
					'ProfileParam',
					{},
					newProfileParam,
					appName,
					appKey,
					member_id,
					memberType
				)
				.then(
					function (pLog) {
						newProfileParam.created.dateTime = dateTime.now();
						newProfileParam.created.member_id = member_id;
						newProfileParam.created.memberType = memberType;
						newProfileParam.created.log_id = pLog._id;
						newProfileParam.save(function (err, profileParam) {
							if (err) {
								return res.status(500).send({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							return res.status(200).send({
								state: 'success',
								message: 'Profile parameter created',
								profileParam: profileParam
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
}

function getAll(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'ProfileParam', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = ProfileParam.find({}, function (err, profileParams) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${profileParams.length}) profileParams`;
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
				'ProfileParam',
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
			message: 'Returned all profile parameters',
			profileParams: profileParams
		});
	});
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function get(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'ProfileParam', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	ProfileParam.findById(req.params.id, function (err, profileParam) {
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
				message: 'Profile parameter not found'
			});
		}
		// create log
		var details = `Read profileParam with _id, ${req.params.id}`;
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
				'ProfileParam',
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
			message: 'Returned profile parameter',
			profileParam: profileParam
		});
	});
}

function deactivate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'ProfileParam', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	ProfileParam.findById(req.params.id, function (err, profileParam) {
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
				message: 'Profile parameter not found'
			});
		}
		if (!profileParam.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Profile parameter already inactive'
			});
		}
		var oldDoc = Object.assign({}, profileParam);
		profileParam.active = false;
		// create log
		var newDoc = Object.assign({}, profileParam);
		var details = 'Deactivated profileParam with _id, ' + req.params.id;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'Update',
				details,
				'ProfileParam',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (pLog) {
					profileParam.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: pLog._id
					});
					profileParam.save(function (err, savedProfileParam) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Deactivated profile parameter',
							profileParam: savedProfileParam
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
	if (!role.hasAccess(req.decoded.admin, 'ProfileParam', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	ProfileParam.findById(req.params.id, function (err, profileParam) {
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
				message: 'Profile parameter not found'
			});
		}
		if (profileParam.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Profile parameter already active'
			});
		}
		// check active profile param with same name
		ProfileParam.findOne(
			{
				paramName: profileParam.paramName,
				active: true
			},
			function (err, activeProfileParam) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (activeProfileParam) {
					return res.status(200).send({
						state: 'failure',
						message:
							'Profile parameter with name ' +
							profileParam.paramName +
							', already active'
					});
				}
				var oldDoc = Object.assign({}, profileParam);
				profileParam.active = true;
				// create log
				var newDoc = Object.assign({}, profileParam);
				var details = 'Activated profileParam with _id, ' + req.params.id;
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = req.decoded.admin
					? req.decoded.admin._id
					: req.decoded.superAdmin._id;
				var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
				log
					.create(
						'Update',
						details,
						'ProfileParam',
						oldDoc,
						newDoc,
						appName,
						appKey,
						member_id,
						memberType
					)
					.then(
						function (pLog) {
							profileParam.updates.push({
								dateTime: dateTime.now(),
								member_id: member_id,
								memberType: memberType,
								log_id: pLog._id
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
				profileParam.save(function (err, savedProfileParam) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					return res.status(200).send({
						state: 'success',
						message: 'Activated profile parameter',
						profileParam: savedProfileParam
					});
				});
			}
		);
	});
}

module.exports = {
	create,
	getAll,
	get,
	deactivate,
	activate
};
