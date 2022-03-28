var axios = require('axios');
var validate = require('./validate');
var xml = require('xml-js');
var butterflySecrets = require('./../secrets/butterfly');

const apiEnd = butterflySecrets.smsGateway.apiEnd;
const user = butterflySecrets.smsGateway.user;
const pass = butterflySecrets.smsGateway.pass;
const sid = butterflySecrets.smsGateway.sid;

function sendSingle(mobileNo, text) {
	return new Promise((resolve, reject) => {
		if (!validate.phoneExt(mobileNo) && !validate.phoneExt('+88' + mobileNo)) {
			return reject({
				state: 'failure',
				message: 'Invalid mobile number'
			});
		}

		var payload =
			'user=' +
			encodeURI(user) +
			'&pass=' +
			encodeURI(pass) +
			'&sid=' +
			encodeURI(sid) +
			'&sms[0][0]=' +
			mobileNo +
			'&sms[0][1]=' +
			encodeURI(text) +
			'&sms[0][2]=' +
			'XXXXXXXXXX' +
			'';
		axios.defaults.headers.post['Content-Type'] =
			'application/x-www-form-urlencoded';
		axios
			.post(apiEnd, payload)
			.then(function (response) {
				var result = JSON.parse(
					xml.xml2json(response.data, {
						compact: true,
						spaces: 2
					})
				);
				if (result.REPLY.SMSINFO) {
					return resolve({
						state: 'success',
						message: 'SMS sent successfully',
						receiver: mobileNo,
						text: text
					});
				}
				// eslint-disable-next-line no-console
				console.log(result);
				return reject({
					state: 'failure',
					message: 'SMS sending failed',
					error: result
				});
			})
			.catch(function (error) {
				return reject({
					state: 'failure',
					message: 'SMS sending failed with error',
					error: error
				});
			});
	});
}

module.exports = {
	sendSingle: sendSingle
};
