var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var jwt = require('jsonwebtoken');
var ejs = require('ejs');
var jwtSecret = require('./../secrets/jwt');
var validate = require('./validate');
var sms = require('./sms-ssl-wireless-v3');
var mailer = require('./mailer');
var sAdmin = require('./../secrets/superAdmin');

var dateTime = require('./dateTime');

var OTP = mongoose.model('OTP');

// Config
var expiryMin = 5;
var expiryHour = 1;

function sendMobile(mobileNo) {
	return new Promise((resolve, reject) => {
		if (!validate.phoneExt(mobileNo) && !validate.phoneExt('+88' + mobileNo)) {
			return reject({
				state: 'failure',
				message: 'Invalid mobile number'
			});
		}
		var now = dateTime.now();
		mobileNo = mobileNo.length === 11 ? '+88' + mobileNo : mobileNo;

		OTP.findOne(
			{
				mobileNo: mobileNo,
				expiresAt: { $gt: now },
				active: true,
				verified: false
			},
			function (err, prevOTP) {
				if (err) {
					return reject({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (prevOTP) {
					prevOTP.active = false;
					// eslint-disable-next-line no-unused-vars
					prevOTP.save(function (err, deactiveOTP) {
						if (err) {
							return reject({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
					});
				}
				now = dateTime.now();
				// generate a new otp
				var digits = '0123456789';
				let generatedOTP = '';
				for (let i = 0; i < 6; i++) {
					generatedOTP += digits[Math.floor(Math.random() * 10)];
				}
				var newOTP = new OTP();
				newOTP.otp = generatedOTP;
				newOTP.mobileNo = mobileNo;
				newOTP.createdAt = now;
				newOTP.expiresAt = now + expiryMin * 60 * 1000;
				newOTP.save(function (err, savedOTP) {
					if (err) {
						return reject({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}

					// send OTP through sms
					var receiver = savedOTP.mobileNo;
					var message =
						'Your Butterfly one time code is ' + savedOTP.otp + '\n';
					message +=
						'The code will expire at, ' +
						new Date(savedOTP.expiresAt).toLocaleString();
					if (process.env.PRODUCTION) {
						message += '\n\n/opBgnUogPHM';
					}
					sms
						.sendSingle(receiver, message)
						.then(
							// eslint-disable-next-line no-unused-vars
							function (result) {
								return resolve({
									state: 'success',
									message: 'OTP sent'
								});
							},
							function (err) {
								return reject(err);
							}
						);
				});
			}
		);
	});
}

function checkMobile(mobileNo, otp) {
	return new Promise((resolve, reject) => {
		if (!validate.phoneExt(mobileNo) && !validate.phoneExt('+88' + mobileNo)) {
			return reject({
				state: 'failure',
				message: 'Invalid mobile number'
			});
		}
		if (otp.length !== 6) {
			return reject({
				state: 'failure',
				message: 'Invalid OTP'
			});
		}
		var now = dateTime.now();
		mobileNo = mobileNo.length === 11 ? '+88' + mobileNo : mobileNo;

		OTP.findOne(
			{
				otp: otp,
				mobileNo: mobileNo,
				expiresAt: { $gt: now },
				active: true,
				verified: false
			},
			function (err, otp) {
				if (err) {
					return reject({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (!otp) {
					return resolve({
						state: 'success',
						message: 'OTP checked',
						usability: false
					});
				}
				return resolve({
					state: 'success',
					message: 'OTP checked',
					usability: true
				});
			}
		);
	});
}

function verifyMobile(mobileNo, otp) {
	return new Promise((resolve, reject) => {
		if (!validate.phoneExt(mobileNo) && !validate.phoneExt('+88' + mobileNo)) {
			return reject({
				state: 'failure',
				message: 'Invalid mobile number'
			});
		}
		if (otp.length !== 6) {
			return reject({
				state: 'failure',
				message: 'Invalid OTP'
			});
		}
		var now = dateTime.now();
		mobileNo = mobileNo.length === 11 ? '+88' + mobileNo : mobileNo;

		OTP.findOne(
			{
				otp: otp,
				mobileNo: mobileNo,
				expiresAt: { $gt: now },
				active: true,
				verified: false
			},
			function (err, otp) {
				if (err) {
					return reject({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (!otp) {
					return reject({
						state: 'failure',
						message: 'Invalid OTP'
					});
				}
				otp.verified = true;
				otp.verifiedAt = now;
				otp.save(function (err, updatedOtp) {
					if (err) {
						return reject({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					return resolve({
						state: 'success',
						message: 'OTP verified',
						otp: updatedOtp
					});
				});
			}
		);
	});
}

function sendEmail(email, member_id, memberType) {
	return new Promise((resolve, reject) => {
		if (!validate.emailExt(email)) {
			return reject({
				state: 'failure',
				message: 'Invalid email address'
			});
		}
		if (member_id === '') {
			return reject({
				state: 'failure',
				message: 'Invalid member id'
			});
		}
		var now = dateTime.now();

		OTP.findOne(
			{
				member_id: member_id,
				expiresAt: { $gt: now },
				active: true,
				verified: false
			},
			function (err, prevOTP) {
				if (err) {
					return reject({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (prevOTP) {
					prevOTP.active = false;
					// eslint-disable-next-line no-unused-vars
					prevOTP.save(function (err, deactiveOTP) {
						if (err) {
							return reject({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
					});
				}
				now = dateTime.now();
				// generate a new otp
				var digits = '0123456789abcdefghijklmnopqrstuvwxyz';
				let generatedOTP = '';
				for (let i = 0; i < 17; i++) {
					generatedOTP += digits[Math.floor(Math.random() * 36)];
				}
				var newOTP = new OTP();
				newOTP.otp = generatedOTP;
				newOTP.member_id = member_id;
				newOTP.createdAt = now;
				newOTP.expiresAt = now + expiryHour * 60 * 60 * 1000;
				newOTP.save(function (err, savedOTP) {
					if (err) {
						return reject({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}

					// create token
					jwt.sign(
						{
							member_id: member_id,
							otp: savedOTP.otp
						},
						jwtSecret[memberType.toLowerCase() + 'Verify'].secret,
						{
							expiresIn:
								jwtSecret[memberType.toLowerCase() + 'Verify'].expiresIn
						},
						async function (err, token) {
							if (err) {
								return reject({
									state: 'failure',
									message: 'token generation failed',
									error: err
								});
							}
							// send OTP through email
							const params = {
								baseUrl: sAdmin.verificationDomain,
								expiryDateTime: new Date(savedOTP.expiresAt).toLocaleString(),
								verificationUrl:
									sAdmin.verificationDomain +
									'/verify/' +
									memberType.toLowerCase() +
									'/email/' +
									token
							};
							var emailHtml = await ejs.renderFile(
								'templates/verificationEmail.html',
								params
							);
							var emailSub = 'Verify Your Email on Butterfly Matrimonial';
							mailer.sendHtml(email, emailSub, emailHtml).then(
								function () {
									return resolve({
										state: 'success',
										message: 'Verification email sent'
									});
								},
								function (err) {
									return reject(err);
								}
							);
						}
					);
				});
			}
		);
	});
}

function verifyAdminEmail(token, reset) {
	return new Promise((resolve, reject) => {
		jwt.verify(token, jwtSecret.adminVerify.secret, function (err, decoded) {
			if (err) {
				return reject({
					state: 'failure',
					message: 'Link invalid'
				});
			}
			var now = dateTime.now();
			OTP.findOne(
				{
					otp: decoded.otp,
					member_id: decoded.member_id,
					expiresAt: { $gt: now },
					active: true,
					verified: false
				},
				function (err, otp) {
					if (err) {
						return reject({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					if (!otp) {
						return reject({
							state: 'failure',
							message: 'Link invalid'
						});
					}
					if (!reset) {
						return resolve({
							state: 'success',
							message: 'Link validated'
						});
					} else {
						now = dateTime.now();
						otp.verified = true;
						otp.verifiedAt = now;
						// eslint-disable-next-line no-unused-vars
						otp.save(function (err, updatedOtp) {
							if (err) {
								return reject({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							return resolve({
								state: 'success',
								message: 'Link verified',
								otp: updatedOtp
							});
						});
					}
				}
			);
		});
	});
}

function verifyUserEmail(token) {
	return new Promise((resolve, reject) => {
		jwt.verify(token, jwtSecret.userVerify.secret, function (err, decoded) {
			if (err) {
				return reject({
					state: 'failure',
					message: 'Link invalid'
				});
			}
			var now = dateTime.now();
			OTP.findOne(
				{
					otp: decoded.otp,
					member_id: decoded.member_id,
					expiresAt: { $gt: now },
					active: true,
					verified: false
				},
				function (err, otp) {
					if (err) {
						return reject({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					if (!otp) {
						return reject({
							state: 'failure',
							message: 'Link invalid'
						});
					}
					now = dateTime.now();
					otp.verified = true;
					otp.verifiedAt = now;
					// eslint-disable-next-line no-unused-vars
					otp.save(function (err, updatedOtp) {
						if (err) {
							return reject({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return resolve({
							state: 'success',
							message: 'Link verified',
							otp: updatedOtp
						});
					});
				}
			);
		});
	});
}

module.exports = {
	send: {
		mobile: sendMobile,
		email: sendEmail
	},
	verify: {
		user: {
			mobile: verifyMobile,
			email: verifyUserEmail
		},
		admin: verifyAdminEmail
	},
	check: {
		mobile: checkMobile
	}
};
