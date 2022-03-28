var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');
// var parse = require('./../../../components/parse');
var log = require('./../../../components/log');
var dateTime = require('./../../../components/dateTime');
// var validate = require('./../../../components/validate');

// Models
var UserProduct = mongoose.model('UserProduct');
// var User = mongoose.model('User');

// Functions
function getAll(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'UserProduct', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = UserProduct.find({}, function (err, userProducts) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${userProducts.length}) userProducts`;
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
				'UserProduct',
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
			message: 'Returned all userProducts',
			userProducts: userProducts
		});
	});
	query.sort('-created.dateTime');
	assert.ok(query.exec() instanceof require('q').makePromise);
}
// TODO
// function getAllData(req, res) {
// 	// check admin role
// 	if (!role.hasAccess(req.decoded.admin, 'UserProduct', 'r')) {
// 		return res.status(200).send({
// 			state: 'failure',
// 			message: 'Action not permitted'
// 		});
// 	}

// 	var query = Policy.find({}, function(err, policies) {
// 		if (err) {
// 			return res.status(500).send({
// 				state: 'failure',
// 				message: 'database error',
// 				error: err
// 			});
// 		}
// 		// parse policies
// 		var parsedPolicies = [];
// 		if (policies.length > 0) {
// 			parsedPolicies = policies.reduce(function(collector, value) {
// 				return collector.concat(parse.policy(value));
// 			}, []);
// 		}

// 		// create log
// 		var details = `Read all (${parsedPolicies.length}) policy data`;
// 		var appName = req.decoded.appKey.name;
// 		var appKey = req.decoded.appKey.token;
// 		var member_id = req.decoded.admin
// 			? req.decoded.admin._id
// 			: req.decoded.superAdmin._id;
// 		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
// 		log.create('read', details, 'UserProduct', {}, {},
// 			appName, appKey, member_id, memberType)
// 			// eslint-disable-next-line
// 			.then(function() {}, err => console.err(err));
// 		return res.status(200).send({
// 			state: 'success',
// 			message: 'Returned all policy data',
// 			policies: parsedPolicies
// 		});
// 	});
// 	query.sort(req.body.newestFirst && req.body.newestFirst === true
// 		? '-created.dateTime' : 'created.dateTime');
// 	assert.ok(query.exec() instanceof require('q').makePromise);
// }
// TODO
// function search(req, res) {
// 	// check admin role
// 	if (!role.hasAccess(req.decoded.admin, 'UserProduct', 'r')) {
// 		return res.status(200).send({
// 			state: 'failure',
// 			message: 'Action not permitted'
// 		});
// 	}

// 	// Defaults
// 	var itemsPerPage = req.body.pagination && req.body.pagination.itemsPerPage
// 		&& !isNaN(parseInt(req.body.pagination.itemsPerPage))
// 		? parseInt(req.body.pagination.itemsPerPage) : 50;
// 	var pageIndex = req.body.pagination && req.body.pagination.pageIndex
// 		&& !isNaN(parseInt(req.body.pagination.pageIndex))
// 		? parseInt(req.body.pagination.pageIndex) : 1;

// 	// Corrections
// 	if (itemsPerPage < 5) {
// 		itemsPerPage = 5;
// 	} else if (itemsPerPage > 500) {
// 		itemsPerPage = 500;
// 	}
// 	if (pageIndex < 1) {
// 		pageIndex = 1;
// 	}

// 	// Switch through modes
// 	if (req.body.filterType && req.body.filterType === 'PENDING'
// 		|| req.body.filterType === 'STARTS' || req.body.filterType === 'ENDS') {
// 		// Date Range Filter
// 		// Accepts: startDate, endDate, policyType, newestFirst

// 		// DateTime Correction
// 		var startDate = req.body.startDate && !isNaN(parseInt(req.body.startDate))
// 			? parseInt(req.body.startDate) : 0;
// 		var endDate = req.body.endDate && !isNaN(parseInt(req.body.endDate))
// 			? parseInt(req.body.endDate) : 0;
// 		if (startDate > endDate) {
// 			endDate += startDate;
// 			startDate = endDate - startDate;
// 			endDate -= startDate;
// 		}

// 		var queryOption = {};
// 		if (req.body.filterType === 'PENDING') {
// 			// first policy whose payment pending only
// 			queryOption = {
// 				'startsAt': 0,
// 				'created.dateTime': startDate !== 0 && endDate !== 0 ? {
// 					$gte: startDate,
// 					$lte: endDate,
// 					$ne: 0
// 				} : startDate !== 0 ? {
// 					$gte: startDate,
// 					$ne: 0
// 				} : endDate !== 0 ? {
// 					$lte: endDate,
// 					$ne: 0
// 				} : {
// 					$ne: 0
// 				},
// 				'productCode': req.body.policyType && req.body.policyType === 'PPA'
// 					|| req.body.policyType === 'NIB' || req.body.policyType === 'MTR'
// 					|| req.body.policyType === 'B&H' ? req.body.policyType : {
// 						$in: ['NIB', 'PPA', 'MTR', 'B&H']
// 					}
// 			};
// 		} else if (req.body.filterType === 'ENDS') {
// 			// last policy that ends
// 			queryOption = {
// 				'expiresAt': startDate !== 0 && endDate !== 0 ? {
// 					$gte: startDate,
// 					$lte: endDate,
// 					$ne: 0
// 				} : startDate !== 0 ? {
// 					$gte: startDate,
// 					$ne: 0
// 				} : endDate !== 0 ? {
// 					$lte: endDate,
// 					$ne: 0
// 				} : {
// 					$ne: 0
// 				},
// 				'productCode': req.body.policyType && req.body.policyType === 'PPA'
// 					|| req.body.policyType === 'NIB' || req.body.policyType === 'MTR'
// 					|| req.body.policyType === 'B&H' ? req.body.policyType : {
// 						$in: ['NIB', 'PPA', 'MTR', 'B&H']
// 					}
// 			};
// 		} else {
// 			// policy first started
// 			queryOption = {
// 				'startsAt': startDate !== 0 && endDate !== 0 ? {
// 					$gte: startDate,
// 					$lte: endDate,
// 					$ne: 0
// 				} : startDate !== 0 ? {
// 					$gte: startDate,
// 					$ne: 0
// 				} : endDate !== 0 ? {
// 					$lte: endDate,
// 					$ne: 0
// 				} : {
// 					$ne: 0
// 				},
// 				'productCode': req.body.policyType && req.body.policyType === 'PPA'
// 					|| req.body.policyType === 'NIB' || req.body.policyType === 'MTR'
// 					|| req.body.policyType === 'B&H' ? req.body.policyType : {
// 						$in: ['NIB', 'PPA', 'MTR', 'B&H']
// 					}
// 			};
// 		}

// 		var queryA = Policy.find(queryOption, function(err, policies) {
// 			if (err) {
// 				return res.status(500).send({
// 					state: 'failure',
// 					message: 'database error',
// 					error: err
// 				});
// 			}
// 			// parse policies
// 			var parsedPolicies = [];
// 			if (policies.length > 0) {
// 				parsedPolicies = policies.reduce(function(collector, value) {
// 					return collector.concat(parse.policy(
// 						value, req.body.filterType === 'ENDS' ? 'ENDS' : 'STARTS'));
// 				}, []);
// 			}
// 			// process pagination
// 			var totalItems = parsedPolicies.length;
// 			var totalPages = Math.ceil(totalItems / itemsPerPage);
// 			if (pageIndex > totalPages) {
// 				pageIndex = totalPages;
// 			}
// 			var cursorIndex = (pageIndex - 1) * itemsPerPage;
// 			var currentItems = parsedPolicies.slice(
// 				cursorIndex, cursorIndex + itemsPerPage);

// 			// create log
// 			var details = `Read ${cursorIndex + 1}-${cursorIndex
// 				+ currentItems.length} of ${totalItems} found policies`;
// 			var appName = req.decoded.appKey.name;
// 			var appKey = req.decoded.appKey.token;
// 			var member_id = req.decoded.admin
// 				? req.decoded.admin._id
// 				: req.decoded.superAdmin._id;
// 			var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
// 			log.create('read', details, 'UserProduct', {}, {},
// 				appName, appKey, member_id, memberType)
// 				// eslint-disable-next-line
// 				.then(function() {}, err => console.err(err));
// 			return res.status(200).send({
// 				state: 'success',
// 				message: 'Returned policies',
// 				pagination: {
// 					totalItems: totalItems,
// 					itemsPerPage: itemsPerPage,
// 					totalPages: totalPages,
// 					pageIndex: pageIndex
// 				},
// 				policies: currentItems
// 			});
// 		});
// 		queryA.sort(req.body.newestFirst && req.body.newestFirst === true
// 			? '-created.dateTime' : 'created.dateTime');
// 		assert.ok(queryA.exec() instanceof require('q').makePromise);
// 	} else if (req.body.filterType && req.body.filterType === 'SEARCH') {
// 		// Query Based Filter
// 		// Accepts: searchQuery, newestFirst
// 		if (req.body.searchQuery && validate.phoneExt(req.body.searchQuery)
// 			|| validate.phoneExt('+88' + req.body.searchQuery)
// 			|| validate.emailExt(req.body.searchQuery)) {
// 			// Phone number or email search
// 			User.findOne({
// 				$or: [
// 					{
// 						mobileNo: req.body.searchQuery
// 					},
// 					{
// 						mobileNo: '+88' + req.body.searchQuery
// 					},
// 					{
// 						email: req.body.searchQuery
// 					}
// 				]
// 			}, function(err, user) {
// 				if (err) {
// 					return res.status(500).send({
// 						state: 'failure',
// 						message: 'database error',
// 						error: err
// 					});
// 				}
// 				if (!user) {
// 					return res.status(200).send({
// 						state: 'success',
// 						message: 'Returned policies',
// 						pagination: {
// 							totalItems: 0,
// 							itemsPerPage: itemsPerPage,
// 							totalPages: 0,
// 							pageIndex: 1
// 						},
// 						policies: []
// 					});
// 				}
// 				var queryB = Policy.find({
// 					user_id: user._id
// 				}, function(err, policies) {
// 					if (err) {
// 						return res.status(500).send({
// 							state: 'failure',
// 							message: 'database error',
// 							error: err
// 						});
// 					}
// 					// parse policies
// 					var parsedPolicies = [];
// 					if (policies.length > 0) {
// 						parsedPolicies = policies.reduce(function(collector, value) {
// 							return collector.concat(parse.policy(value));
// 						}, []);
// 					}
// 					// process pagination
// 					var totalItems = parsedPolicies.length;
// 					var totalPages = Math.ceil(totalItems / itemsPerPage);
// 					if (pageIndex > totalPages) {
// 						pageIndex = totalPages;
// 					}
// 					var cursorIndex = (pageIndex - 1) * itemsPerPage;
// 					var currentItems = parsedPolicies.slice(
// 						cursorIndex, cursorIndex + itemsPerPage);

// 					// create log
// 					var details = `Read ${cursorIndex + 1}-${cursorIndex
// 						+ currentItems.length} of ${totalItems} found policies`;
// 					var appName = req.decoded.appKey.name;
// 					var appKey = req.decoded.appKey.token;
// 					var member_id = req.decoded.admin
// 						? req.decoded.admin._id
// 						: req.decoded.superAdmin._id;
// 					var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
// 					log.create('read', details, 'UserProduct', {}, {},
// 						appName, appKey, member_id, memberType)
// 						// eslint-disable-next-line
// 						.then(function() {}, err => console.err(err));
// 					return res.status(200).send({
// 						state: 'success',
// 						message: 'Returned policies',
// 						pagination: {
// 							totalItems: totalItems,
// 							itemsPerPage: itemsPerPage,
// 							totalPages: totalPages,
// 							pageIndex: pageIndex
// 						},
// 						policies: currentItems
// 					});
// 				});
// 				queryB.sort(req.body.newestFirst && req.body.newestFirst === true
// 					? '-created.dateTime' : 'created.dateTime');
// 				assert.ok(queryB.exec() instanceof require('q').makePromise);
// 			});
// 		} else {
// 			// DocID search
// 			var queryC = Policy.find({
// 				$or: [
// 					{
// 						doc_id: new RegExp(req.body.searchQuery
// 							? req.body.searchQuery.toString() : '' , 'i')
// 					},
// 					{
// 						'renewals.doc_id': new RegExp(req.body.searchQuery
// 							? req.body.searchQuery.toString() : '' , 'i')
// 					}
// 				]
// 			}, function(err, policies) {
// 				if (err) {
// 					return res.status(500).send({
// 						state: 'failure',
// 						message: 'database error',
// 						error: err
// 					});
// 				}
// 				// parse policies
// 				var parsedPolicies = [];
// 				if (policies.length > 0) {
// 					parsedPolicies = policies.reduce(function(collector, value) {
// 						return collector.concat(parse.policy(value));
// 					}, []);
// 				}
// 				// process pagination
// 				var totalItems = parsedPolicies.length;
// 				var totalPages = Math.ceil(totalItems / itemsPerPage);
// 				if (pageIndex > totalPages) {
// 					pageIndex = totalPages;
// 				}
// 				var cursorIndex = (pageIndex - 1) * itemsPerPage;
// 				var currentItems = parsedPolicies.slice(
// 					cursorIndex, cursorIndex + itemsPerPage);

// 				// create log
// 				var details = `Read ${cursorIndex + 1}-${cursorIndex
// 					+ currentItems.length} of ${totalItems} found policies`;
// 				var appName = req.decoded.appKey.name;
// 				var appKey = req.decoded.appKey.token;
// 				var member_id = req.decoded.admin
// 					? req.decoded.admin._id
// 					: req.decoded.superAdmin._id;
// 				var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
// 				log.create('read', details, 'UserProduct', {}, {},
// 					appName, appKey, member_id, memberType)
// 					// eslint-disable-next-line
// 					.then(function() {}, err => console.err(err));
// 				return res.status(200).send({
// 					state: 'success',
// 					message: 'Returned policies',
// 					pagination: {
// 						totalItems: totalItems,
// 						itemsPerPage: itemsPerPage,
// 						totalPages: totalPages,
// 						pageIndex: pageIndex
// 					},
// 					policies: currentItems
// 				});
// 			});
// 			queryC.sort(req.body.newestFirst && req.body.newestFirst === true
// 				? '-created.dateTime' : 'created.dateTime');
// 			assert.ok(queryC.exec() instanceof require('q').makePromise);
// 		}
// 	} else if (!req.body.filterType || req.body.filterType === 'NONE') {
// 		// No Filter
// 		// Accepts: policyType, newestFirst
// 		var queryD = Policy.find({
// 			'productCode': req.body.policyType && req.body.policyType === 'NIB'
// 				|| req.body.policyType === 'PPA' || req.body.policyType === 'MTR'
// 				|| req.body.policyType === 'B&H' ? req.body.policyType : {
// 					$in: ['NIB', 'PPA', 'MTR', 'B&H']
// 				}
// 		}, function(err, policies) {
// 			if (err) {
// 				return res.status(500).send({
// 					state: 'failure',
// 					message: 'database error',
// 					error: err
// 				});
// 			}
// 			// parse policies
// 			var parsedPolicies = [];
// 			if (policies.length > 0) {
// 				parsedPolicies = policies.reduce(function(collector, value) {
// 					return collector.concat(parse.policy(value));
// 				}, []);
// 			}
// 			// process pagination
// 			var totalItems = parsedPolicies.length;
// 			var totalPages = Math.ceil(totalItems / itemsPerPage);
// 			if (pageIndex > totalPages) {
// 				pageIndex = totalPages;
// 			}
// 			var cursorIndex = (pageIndex - 1) * itemsPerPage;
// 			var currentItems = parsedPolicies.slice(
// 				cursorIndex, cursorIndex + itemsPerPage);

// 			// create log
// 			var details = `Read ${cursorIndex + 1}-${cursorIndex
// 				+ currentItems.length} of ${totalItems} found policies`;
// 			var appName = req.decoded.appKey.name;
// 			var appKey = req.decoded.appKey.token;
// 			var member_id = req.decoded.admin
// 				? req.decoded.admin._id
// 				: req.decoded.superAdmin._id;
// 			var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
// 			log.create('read', details, 'UserProduct', {}, {},
// 				appName, appKey, member_id, memberType)
// 				// eslint-disable-next-line
// 				.then(function() {}, err => console.err(err));
// 			return res.status(200).send({
// 				state: 'success',
// 				message: 'Returned policies',
// 				pagination: {
// 					totalItems: totalItems,
// 					itemsPerPage: itemsPerPage,
// 					totalPages: totalPages,
// 					pageIndex: pageIndex
// 				},
// 				policies: currentItems
// 			});
// 		});
// 		queryD.sort(req.body.newestFirst && req.body.newestFirst === true
// 			? '-created.dateTime' : 'created.dateTime');
// 		assert.ok(queryD.exec() instanceof require('q').makePromise);
// 	}
// }

function get(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'UserProduct', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	UserProduct.findById(req.params.id, function (err, userProduct) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!userProduct) {
			return res.status(200).send({
				state: 'failure',
				message: 'UserProduct not found'
			});
		}
		// create log
		var details = `Read userProduct (_id: ${req.params.id})`;
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
				'UserProduct',
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
			message: 'Returned userProduct',
			userProduct: userProduct
		});
	});
}

function deactivate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'UserProduct', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	UserProduct.findById(req.params.id, function (err, userProduct) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!userProduct) {
			return res.status(200).send({
				state: 'failure',
				message: 'UserProduct not found'
			});
		}
		if (!userProduct.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'UserProduct is already deactivated',
				userProduct: userProduct
			});
		}
		// create log
		var details = `Deactivated userProduct (_id: ${req.params.id})`;
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
				function (upLog) {
					userProduct.active = false;
					userProduct.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: upLog._id
					});
					userProduct.save(function (err, savedUserProduct) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'UserProduct deactivated successfully',
							userProduct: savedUserProduct
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
	if (!role.hasAccess(req.decoded.admin, 'UserProduct', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	UserProduct.findById(req.params.id, function (err, userProduct) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!userProduct) {
			return res.status(200).send({
				state: 'failure',
				message: 'UserProduct not found'
			});
		}
		if (userProduct.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'UserProduct is already activated',
				userProduct: userProduct
			});
		}
		// create log
		var details = `Activated userProduct (_id: ${req.params.id})`;
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
				function (upLog) {
					userProduct.active = true;
					userProduct.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: upLog._id
					});
					userProduct.save(function (err, savedUserProduct) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'UserProduct activated successfully',
							userProduct: savedUserProduct
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
	/*getAllData,*/ get /*search,*/,
	deactivate,
	activate
};
