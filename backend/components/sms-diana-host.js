var rp = require('request-promise');
var validate = require('./validate');
var butterflySecrets = require('./../secrets/butterfly');

function sendSingle(mobileNo, text, masking = true) {
	return new Promise((resolve, reject) => {
		if (!validate.phoneExt(mobileNo)) {
			var err = new Error('Invalid phone number');
			err.status = 400;
			return reject(err);
		}
		mobileNo = mobileNo.substring(3);
		var options = {
			method: 'POST',
			uri: `${butterflySecrets.smsGateway.api_url}?api_key=${
				butterflySecrets.smsGateway.api_key
			}&type=text&senderid=${
				masking === true ? butterflySecrets.smsGateway.masked_sid
					: butterflySecrets.smsGateway.non_masked_sid
			}&contacts=${mobileNo}&msg=${text}`,
			json: true // Automatically stringifies the body to JSON
		};
		rp(options)
			.then(function (response) {
				if (typeof response === 'number') {
					if (response === 1007 && masking === true) {
						sendSingle(mobileNo, text, false).then(
							function (result) {
								return resolve(result);
							},
							function (err) {
								return reject(err);
							}
						);
					} else {
						return reject(response);
					}
				} else {
					return resolve(response);
				}
			})
			.catch(function (err) {
				return reject(err);
			});
	});
}

module.exports = {
	sendSingle: sendSingle
};
