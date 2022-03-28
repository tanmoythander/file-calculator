var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');
var log = require('./../../../components/log');

// Models
var Subscription = mongoose.model('Subscription');

// Functions
function getAll(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Subscription', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = Subscription.find({}, function (err, subscriptions) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${subscriptions.length}) subscriptions`;
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
				'Subscription',
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
			message: 'Returned all subscriptions',
			subscriptions: subscriptions
		});
	});
	query.sort('-active');
	assert.ok(query.exec() instanceof require('q').makePromise);
}

module.exports = {
	getAll
};
