var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');

// Models
var Log = mongoose.model('Log');

// Functions
function getLatest(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Log', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = Log.find(
		{
			$and: [
				{
					details: {
						$ne: 'User token reset'
					}
				},
				{
					details: {
						$ne: 'Admin token reset'
					}
				},
				{
					'created.memberType': {
						$ne: 'SuperAdmin'
					}
				}
			]
		},
		function (err, logs) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			return res.status(200).send({
				state: 'success',
				message: 'Returned latest logs',
				logs: logs
			});
		}
	);
	query.sort('-created.dateTime');
	query.limit(100);
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function getLines(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Log', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var lines = !isNaN(parseInt(req.params.lines))
		? parseInt(req.params.lines)
		: 100;
	var query = Log.find(
		{
			$and: [
				{
					details: {
						$ne: 'User token reset'
					}
				},
				{
					details: {
						$ne: 'Admin token reset'
					}
				},
				{
					'created.memberType': {
						$ne: 'SuperAdmin'
					}
				}
			]
		},
		function (err, logs) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			return res.status(200).send({
				state: 'success',
				message: `Returned last ${lines} lines of logs`,
				logs: logs
			});
		}
	);
	query.sort('-created.dateTime');
	query.limit(
		!isNaN(parseInt(req.params.lines)) ? parseInt(req.params.lines) : 100
	);
	assert.ok(query.exec() instanceof require('q').makePromise);
}

module.exports = {
	getLatest,
	getLines
};
