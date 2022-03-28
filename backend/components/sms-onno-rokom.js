var rp = require('request-promise');
var validate = require('./validate');

function sendSingle(mobileNo, text) {
	return new Promise((resolve, reject) => {
		if (!validate.phoneExt(mobileNo)) {
			var err = new Error('Invalid phone number');
			err.status = 400;
			return reject(err);
		}
		var options = {
			method: 'POST',
			uri:
				'https://api2.onnorokomsms.com/HttpSendSms.ashx?op=NumberSms' +
				'&apiKey=22849dbb-6504-49ef-9bc4-76abfa145a88&type=TEXT&mobile=' +
				mobileNo +
				'&smsText=' +
				text,
			json: true // Automatically stringifies the body to JSON
		};
		rp(options)
			.then(function (response) {
				return resolve(response);
			})
			.catch(function (err) {
				return reject(err);
			});
	});
}

module.exports = {
	sendSingle: sendSingle
};
