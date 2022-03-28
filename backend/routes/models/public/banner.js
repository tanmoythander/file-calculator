var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');

// Models
var Banner = mongoose.model('Banner');

function getAll(req, res) {
	var query = Banner.find(
		{
			expiresAt: {
				$gt: dateTime.now()
			},
			active: true
		},
		function (err, banners) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			// create log
			var details = `Read all available (${banners.length}) banners`;
			var appName = req.decoded.appKey.name;
			var appKey = req.decoded.appKey.token;
			var member_id = 'UNKNOWN';
			var memberType = 'Public';
			log
				.create(
					'read',
					details,
					'Banner',
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
				message: 'Returned available banners',
				banners: banners
			});
		}
	);
	query.sort('-created.dateTime');
	assert.ok(query.exec() instanceof require('q').makePromise);
}

module.exports = {
	getAll
};
