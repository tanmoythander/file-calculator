var nodemailer = require('nodemailer');
var key = require('./../secrets/nodemailer');
var validate = require('./validate');
var transporter = nodemailer.createTransport({
	host: key.host,
	port: 465,
	secure: true,
	auth: key
});

/* eslint-disable no-console, max-len */
function send(
	receivers,
	subject,
	message,
	replyTo = undefined,
	cc = [],
	bcc = []
) {
	return new Promise((resolve, reject) => {
		// receiver validation
		if (Array.isArray(receivers)) {
			var validReceivers = [];
			receivers.forEach(function (item) {
				if (validate.emailExt(item)) {
					validReceivers.push(item);
				}
			});
			if (validReceivers.length === 0) {
				return reject({
					state: 'failure',
					message: 'At least one valid receiver is required'
				});
			}
			receivers = validReceivers;
		} else if (!validate.emailExt(receivers)) {
			return reject({
				state: 'failure',
				message: 'Invalid email address'
			});
		}

		// cc validation
		if (Array.isArray(cc)) {
			var validCC = [];
			cc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validCC.push(item);
				}
			});
			cc = validCC;
		} else if (!validate.emailExt(cc)) {
			cc = [];
		}

		// bcc validation
		if (Array.isArray(bcc)) {
			var validBCC = [];
			bcc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validBCC.push(item);
				}
			});
			bcc = validBCC;
		} else if (!validate.emailExt(bcc)) {
			bcc = [];
		}

		// prepare transporter
		transporter
			.sendMail({
				from: key.address,
				to: receivers,
				cc: cc,
				bcc: bcc,
				replyTo: replyTo,
				subject: subject,
				text: message,
				html:
					'<p>' +
					message
						.split('\n')
						.reduce((total, current) => (total += '<br>' + current)) +
					'</p>'
			})
			.then(function (info) {
				return resolve({
					state: 'success',
					message:
						'Email' +
						(Array.isArray(receivers) ? 's are' : '') +
						' sent successfully',
					info: info
				});
			})
			.catch(function (err) {
				return reject({
					state: 'failure',
					message: 'mailer error',
					error: err
				});
			});
	});
}

function sendWithAttachments(
	receivers,
	subject,
	message,
	attachments,
	replyTo = undefined,
	cc = [],
	bcc = []
) {
	return new Promise((resolve, reject) => {
		// receiver validation
		if (Array.isArray(receivers)) {
			var validReceivers = [];
			receivers.forEach(function (item) {
				if (validate.emailExt(item)) {
					validReceivers.push(item);
				}
			});
			if (validReceivers.length === 0) {
				return reject({
					state: 'failure',
					message: 'At least one valid receiver is required'
				});
			}
			receivers = validReceivers;
		} else if (!validate.emailExt(receivers)) {
			return reject({
				state: 'failure',
				message: 'Invalid email address'
			});
		}

		// cc validation
		if (Array.isArray(cc)) {
			var validCC = [];
			cc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validCC.push(item);
				}
			});
			cc = validCC;
		} else if (!validate.emailExt(cc)) {
			cc = [];
		}

		// bcc validation
		if (Array.isArray(bcc)) {
			var validBCC = [];
			bcc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validBCC.push(item);
				}
			});
			bcc = validBCC;
		} else if (!validate.emailExt(bcc)) {
			bcc = [];
		}

		// attachment validation
		if (Array.isArray(attachments)) {
			var validAttachments = [];
			attachments.forEach(function (item) {
				if ((item.content && item.filename) || item.path) {
					validAttachments.push(item);
				}
			});
			attachments = validAttachments;
		} else if (
			(!attachments.content || !attachments.filename) &&
			!attachments.path
		) {
			attachments = [];
		}
		// prepare transporter
		transporter
			.sendMail({
				from: key.address,
				to: receivers,
				cc: cc,
				bcc: bcc,
				replyTo: replyTo,
				subject: subject,
				text: message,
				html:
					'<p>' +
					message
						.split('\n')
						.reduce((total, current) => (total += '<br>' + current)) +
					'</p>',
				attachments: attachments
			})
			.then(function (info) {
				return resolve({
					state: 'success',
					message:
						'Email' +
						(Array.isArray(receivers) && receivers.length > 1 ? 's are' : '') +
						' sent successfully with attachment' +
						(Array.isArray(attachments) && attachments.length > 1 ? 's' : ''),
					info: info
				});
			})
			.catch(function (err) {
				return reject({
					state: 'failure',
					message: 'mailer error',
					error: err
				});
			});
	});
}

function sendHtml(
	receivers,
	subject,
	html,
	text = undefined,
	replyTo = undefined,
	cc = [],
	bcc = []
) {
	return new Promise((resolve, reject) => {
		// receiver validation
		if (Array.isArray(receivers)) {
			var validReceivers = [];
			receivers.forEach(function (item) {
				if (validate.emailExt(item)) {
					validReceivers.push(item);
				}
			});
			if (validReceivers.length === 0) {
				return reject({
					state: 'failure',
					message: 'At least one valid receiver is required'
				});
			}
			receivers = validReceivers;
		} else if (!validate.emailExt(receivers)) {
			return reject({
				state: 'failure',
				message: 'Invalid email address'
			});
		}

		// cc validation
		if (Array.isArray(cc)) {
			var validCC = [];
			cc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validCC.push(item);
				}
			});
			cc = validCC;
		} else if (!validate.emailExt(cc)) {
			cc = [];
		}

		// bcc validation
		if (Array.isArray(bcc)) {
			var validBCC = [];
			bcc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validBCC.push(item);
				}
			});
			bcc = validBCC;
		} else if (!validate.emailExt(bcc)) {
			bcc = [];
		}

		// prepare transporter
		transporter
			.sendMail({
				from: key.address,
				to: receivers,
				cc: cc,
				bcc: bcc,
				replyTo: replyTo,
				subject: subject,
				html: html,
				text: text
			})
			.then(function (info) {
				return resolve({
					state: 'success',
					message:
						'Email' +
						(Array.isArray(receivers) ? 's are' : '') +
						' sent successfully',
					info: info
				});
			})
			.catch(function (err) {
				return reject({
					state: 'failure',
					message: 'mailer error',
					error: err
				});
			});
	});
}

function sendHtmlWithAttachments(
	receivers,
	subject,
	html,
	attachments,
	text = undefined,
	replyTo = undefined,
	cc = [],
	bcc = []
) {
	return new Promise((resolve, reject) => {
		// receiver validation
		if (Array.isArray(receivers)) {
			var validReceivers = [];
			receivers.forEach(function (item) {
				if (validate.emailExt(item)) {
					validReceivers.push(item);
				}
			});
			if (validReceivers.length === 0) {
				return reject({
					state: 'failure',
					message: 'At least one valid receiver is required'
				});
			}
			receivers = validReceivers;
		} else if (!validate.emailExt(receivers)) {
			return reject({
				state: 'failure',
				message: 'Invalid email address'
			});
		}

		// cc validation
		if (Array.isArray(cc)) {
			var validCC = [];
			cc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validCC.push(item);
				}
			});
			cc = validCC;
		} else if (!validate.emailExt(cc)) {
			cc = [];
		}

		// bcc validation
		if (Array.isArray(bcc)) {
			var validBCC = [];
			bcc.forEach(function (item) {
				if (validate.emailExt(item)) {
					validBCC.push(item);
				}
			});
			bcc = validBCC;
		} else if (!validate.emailExt(bcc)) {
			bcc = [];
		}

		// attachment validation
		if (Array.isArray(attachments)) {
			var validAttachments = [];
			attachments.forEach(function (item) {
				if ((item.content && item.filename) || item.path) {
					validAttachments.push(item);
				}
			});
			attachments = validAttachments;
		} else if (
			(!attachments.content || !attachments.filename) &&
			!attachments.path
		) {
			attachments = [];
		}
		// prepare transporter
		transporter
			.sendMail({
				from: key.address,
				to: receivers,
				cc: cc,
				bcc: bcc,
				replyTo: replyTo,
				subject: subject,
				html: html,
				text: text,
				attachments: attachments
			})
			.then(function (info) {
				return resolve({
					state: 'success',
					message:
						'Email' +
						(Array.isArray(receivers) && receivers.length > 1 ? 's are' : '') +
						' sent successfully with attachment' +
						(Array.isArray(attachments) && attachments.length > 1 ? 's' : ''),
					info: info
				});
			})
			.catch(function (err) {
				return reject({
					state: 'failure',
					message: 'mailer error',
					error: err
				});
			});
	});
}

function sendInitMail(message) {
	console.log('Notifying backend team');
	var env = process.env.PRODUCTION ? 'Production' : 'Development';
	transporter
		.sendMail({
			from: key.address,
			to: 'tanmoy@quanticdynamics.com',
			cc: 'ashiq@quanticdynamics.com,khandoker@quanticdynamics.com',
			subject: 'Server activation notification',
			text: 'Server Butterfly-Matrimonial-Backend started',
			html:
				'<h3>Server Butterfly-Matrimonial-Backend started</h3><br><p>Environment: ' +
				env +
				'</p><p>' +
				message +
				'</p>'
		})
		.then(function (info) {
			console.log('success');
			console.log(info);
		})
		.catch(function (err) {
			console.log('error sending email');
			console.log(err);
		});
}

function sendOTP(email, otp) {
	console.log('Sending otp through email');
	var message = 'Your OTP for Green Delta App is, ' + otp.otp + '.';
	message += ' Expires at, ' + new Date(otp.expiresAt).toLocaleString();
	var env = process.env.PRODUCTION ? 'Production' : 'Development';
	transporter
		.sendMail({
			from: key.address,
			to: email,
			subject: 'Your OTP for Green Delta App',
			text: message,
			html:
				'<h3>' +
				message +
				'</h3><br><p>Environment: ' +
				env +
				'</p><p>' +
				message +
				'</p>'
		})
		.then(function (info) {
			console.log('success');
			console.log(info);
		})
		.catch(function (err) {
			console.log('Error sending otp through email');
			console.log(err);
		});
}

function sendSignupMail(email, password) {
	console.log('Sending signup email');
	transporter
		.sendMail({
			from: key.address,
			to: email,
			subject: 'Your QD account has been created',
			text:
				'Congratulation! Your QD account has just been created. Your email/username is, ' +
				email +
				' and password is, "' +
				password +
				'". Please remember that, we don\'t have a copy of this password and ' +
				"we can't resend this email. It is recommended to change the password once you login. " +
				'Thank you.',
			html:
				'<h2>Congratulation!</h2>' +
				'<h3>Your QD account has just been created</h3>' +
				'<br><p>Email/username: ' +
				email +
				'</p><p>Password: <strong>' +
				password +
				'</strong></p>' +
				"<br><p>Please remember that, we don't have a copy of this password and we can't resend this email. It is recommended to change the password once you login.</p>" +
				'<br><p>Thank you.</p>'
		})
		.then(function (info) {
			console.log('Successfully sent signup email');
			console.log(info);
		})
		.catch(function (err) {
			console.log('error sending email');
			console.log(err);
		});
}

function sendResetMail(email, password) {
	console.log('Sending reset password email');
	transporter
		.sendMail({
			from: key.address,
			to: email,
			subject: 'Your QD account password has been reset',
			text:
				'Your QD account has just been created. Your new password is, "' +
				password +
				'". Please remember that, we don\'t have a copy of this password and ' +
				"we can't resend this email. It is recommended to change the password once you login. " +
				'Thank you.',
			html:
				'<h3>Your QD account password has just been reset</h3>' +
				'<br><p>New password: <strong>' +
				password +
				'</strong></p>' +
				"<br><p>Please remember that, we don't have a copy of this new password and we can't resend this email. It is recommended to change the password once you login.</p>" +
				'<br><p>Thank you.</p>'
		})
		.then(function (info) {
			console.log('Successfully sent reset password email');
			console.log(info);
		})
		.catch(function (err) {
			console.log('error sending email');
			console.log(err);
		});
}
/* eslint-enable no-console, max-len */

module.exports = {
	send: send,
	sendWithAttachments: sendWithAttachments,
	sendHtml: sendHtml,
	sendHtmlWithAttachments: sendHtmlWithAttachments,
	sendSingle: send,
	sendSingleWithAttachments: sendWithAttachments,
	sendInitMail: sendInitMail,
	sendOTP: sendOTP,
	sendSignupMail: sendSignupMail,
	sendResetMail: sendResetMail
};
