var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');

// Models
var ProductParam = mongoose.model('ProductParam');

// Functions
function create(req, res) {
	/* eslint-enable max-len */
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'ProductParam', 'rw')) {
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
	ProductParam.findOne(
		{
			paramName: req.body.paramName.toString().trim()
		},
		function (err, exstProductParam) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			// exists already
			if (exstProductParam) {
				return res.status(200).send({
					state: 'failure',
					message:
						req.body.paramName.toString().trim() + ', parameter already exists'
				});
			}
			// create new
			var newProductParam = new ProductParam();
			newProductParam.paramName = req.body.paramName.toString().trim();
			if (req.body.paramRequired) {
				newProductParam.paramRequired = req.body.paramRequired;
			}
			if (req.body.paramType) {
				newProductParam.paramType = req.body.paramType.toString().trim();
				if (newProductParam.paramType === 'string' && req.body.paramEnums) {
					// String with enum values
					newProductParam.paramEnums = req.body.paramEnums.map(function (item) {
						return item.toString().trim();
					});
				}
			}
			// create log
			var details = 'Created productParam';
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
					'ProductParam',
					{},
					newProductParam,
					appName,
					appKey,
					member_id,
					memberType
				)
				.then(
					function (pLog) {
						newProductParam.created.dateTime = dateTime.now();
						newProductParam.created.member_id = member_id;
						newProductParam.created.memberType = memberType;
						newProductParam.created.log_id = pLog._id;
						newProductParam.save(function (err, productParam) {
							if (err) {
								return res.status(500).send({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							return res.status(200).send({
								state: 'success',
								message: 'Product parameter created',
								productParam: productParam
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
	if (!role.hasAccess(req.decoded.admin, 'ProductParam', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = ProductParam.find({}, function (err, productParams) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${productParams.length}) productParams`;
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
				'ProductParam',
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
			message: 'Returned all product parameters',
			productParams: productParams
		});
	});
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function get(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'ProductParam', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	ProductParam.findById(req.params.id, function (err, productParam) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!productParam) {
			return res.status(200).send({
				state: 'failure',
				message: 'Product parameter not found'
			});
		}
		// create log
		var details = `Read productParam with _id, ${req.params.id}`;
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
				'ProductParam',
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
			message: 'Returned product parameter',
			productParam: productParam
		});
	});
}

module.exports = {
	create,
	getAll,
	get
};
