var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;

// Models
var SuperAdmin = mongoose.model('SuperAdmin');

// Verify App Key
function checkMaintenance(req, res, next) {
	SuperAdmin.findOne({}, function (err, superAdmin) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (superAdmin.config.maintenance === true) {
			return res.status(200).send({
				state: 'failure',
				message: 'Server under maintenance. Please try again later.'
			});
		}
		return next();
	});
}

module.exports = {
	checkMaintenance
};
