var rp = require('request-promise');
var validate = require('./validate');
var butterflySecrets = require('./../secrets/butterfly');

function sendSingle(mobileNo, text) {
	return new Promise((resolve, reject) => {
		if (!validate.phoneExt(mobileNo)) {
			var err = new Error('Invalid phone number');
			err.status = 400;
			return reject(err);
		}
		var options = {
			method: 'POST',
			uri: `${butterflySecrets.smsGateway.apiEnd}?api_token=${
				butterflySecrets.smsGateway.apiToken
			}&sid=${
				butterflySecrets.smsGateway.sid
			}&msisdn=${mobileNo.substring(3)}&sms=${text}&csms_id=${1}`,
			json: true // Automatically stringifies the body to JSON
		};
		rp(options)
			.then(function (response) {
				if (response.status === 'SUCCESS') {
					return resolve(response);
				}
				return reject(response);
			})
			.catch(function (err) {
				return reject(err);
			});
	});
}

module.exports = {
	sendSingle: sendSingle
};
