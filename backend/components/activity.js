/* eslint-disable no-console */
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var dateTime = require('./dateTime');

var Activity = mongoose.model('Activity');

function save(
	user_id,
	linkedUser_id,
	icon,
	details,
	log_id
) {
	var newActivity = new Activity();
	newActivity.user_id = user_id;
	newActivity.linkedUser_id = linkedUser_id;
	newActivity.icon = icon;
	newActivity.details = details;
	newActivity.created.dateTime = dateTime.now();
	newActivity.created.log_id = log_id;

	// eslint-disable-next-line no-unused-vars
	newActivity.save(function (err, activity) {
		if (err) {
			console.error(err);
		} else {
			console.log('Activity feed updated');
		}
	});
}

module.exports = {
	save: save
};
