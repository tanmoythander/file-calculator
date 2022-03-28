var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var dateTime = require('./dateTime');

var Log = mongoose.model('Log');

function create(
	action,
	details,
	collection,
	oldDoc,
	newDoc,
	appName,
	appKey,
	member_id,
	memberType
) {
	return new Promise((resolve, reject) => {
		var newLog = new Log();
		newLog.action = action;
		newLog.collectionName = collection;
		newLog.appName = appName;
		newLog.appKey = appKey;
		newLog.created.dateTime = dateTime.now();
		newLog.created.member_id = member_id;
		newLog.created.memberType = memberType;

		if (details) {
			newLog.details = details;
		}
		if (oldDoc) {
			newLog.oldDoc = JSON.stringify(oldDoc);
		}
		if (newDoc) {
			newLog.newDoc = JSON.stringify(newDoc);
		}

		newLog.save(function (err, log) {
			if (err) {
				return reject(err);
			}
			return resolve(log);
		});
	});
}

module.exports = {
	create: create
};
