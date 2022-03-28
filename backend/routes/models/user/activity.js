var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');

var User = mongoose.model('User');
var Activity = mongoose.model('Activity');

function get(req, res) {
	const user = req.decoded.user;

	// prepare slice metrics
	const size = !req.body.slice || !req.body.slice.size
		|| isNaN(req.body.slice.size) ? 50
		: req.body.slice.size < 10 ? 10
			: req.body.slice.size > 500
				? 500 : req.body.slice.size;
	const skip = !req.body.slice || !req.body.slice.skip
		|| isNaN(req.body.slice.skip) || req.body.slice.skip
		< 0 ? 0 : req.body.slice.skip;

	var activityQuery = Activity.find({
		'user_id': user._id.toString()
	}, function(err, activities) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		var slicedActivities = activities.slice(skip, skip + size);
		if (slicedActivities.length === 0) {
			return res.status(200).send({
				state: 'success',
				message: 'Returned activities',
				slice: {
					totalActivities: activities.length,
					size: size,
					skip: skip
				},
				activities: []
			});
		}
		const ownActivities = slicedActivities.filter(function(item) {
			return item.user_id === item.photoUser_id;
		});
		const otherActivities = slicedActivities.filter(function(item) {
			return item.user_id !== item.photoUser_id;
		});
		var processedActivities = ownActivities.map(function(item) {
			item.photo = user.profile.photos[0].url;
			return item;
		});
		if (processedActivities.length === slicedActivities.length) {
			return res.status(200).send({
				state: 'success',
				message: 'Returned activities',
				slice: {
					totalActivities: activities.length,
					size: size,
					skip: skip
				},
				activities: processedActivities
			});
		}
		otherActivities.forEach(function(activity) {
			var userQuery = User.findById(
				activity.linkedUser_id, function(err, photoUser) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					activity.photo = photoUser.profile.photos[0].url;
					processedActivities.push(activity);
					if (processedActivities.length === slicedActivities.length) {
						processedActivities.sort(function(a, b) {
							return b.created.dateTime - a.created.dateTime;
						});
						return res.status(200).send({
							state: 'success',
							message: 'Returned activities',
							slice: {
								totalActivities: activities.length,
								size: size,
								skip: skip
							},
							activities: processedActivities
						});
					}
				}).lean();
			userQuery.select('profile.photos');
			assert.ok(userQuery.exec() instanceof require('q').makePromise);
		});
	}).lean();
	activityQuery.sort('-created.dateTime');
	assert.ok(activityQuery.exec() instanceof require('q').makePromise);
}

module.exports = {
	get
};
