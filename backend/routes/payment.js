/* eslint-disable no-console */
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var rp = require('request-promise');
var ejs = require('ejs');
var mailer = require('./../components/mailer');
var sms = require('./../components/sms-ssl-wireless-v3');
var log = require('./../components/log');
var dateTime = require('./../components/dateTime');
var butterflySecret = require('./../secrets/butterfly');
var sAdmin = require('./../secrets/superAdmin');

// Models
var User = mongoose.model('User');
var UserProduct = mongoose.model('UserProduct');
var Payment = mongoose.model('Payment');

// Functions
var saveNullPayment = function (response, storeName) {
	console.log(
		response.val_id + ' - WARNING: Saving Invalid Payment For Investigation'
	);
	var nullPayment = new Payment();
	nullPayment.user_id = 'NONE';
	nullPayment.userProduct_id = 'NONE';
	nullPayment.active = false;
	nullPayment.storeName = storeName;
	nullPayment.amount = parseFloat(response.amount);
	nullPayment.store_amount = parseFloat(response.store_amount);
	nullPayment.tran_date = new Date(response.tran_date).getTime();
	nullPayment.val_id = response.val_id;
	nullPayment.card_type = response.card_type;
	nullPayment.card_no = response.card_no;
	nullPayment.currency = response.currency;
	nullPayment.bank_tran_id = response.bank_tran_id;
	nullPayment.card_issuer = response.card_issuer;
	nullPayment.card_brand = response.card_brand;
	nullPayment.card_issuer_country = response.card_issuer_country;
	nullPayment.card_issuer_country_code = response.card_issuer_country_code;
	nullPayment.appName = 'NONE';
	var newDoc = Object.assign({}, nullPayment);
	var details = 'Invalid payment saved for investigation';
	var appName = 'NONE';
	var appKey = 'NONE';
	log
		.create(
			'create',
			details,
			'Payment',
			{},
			newDoc,
			appName,
			appKey,
			'NONE',
			'System'
		)
		.then(
			function (tLog) {
				nullPayment.created.dateTime = dateTime.now();
				nullPayment.created.member_id = 'NONE';
				nullPayment.created.memberType = 'System';
				nullPayment.created.log_id = tLog._id;
				nullPayment.save(function (err, payment) {
					if (err) {
						console.log(
							response.val_id + ' - ERROR: Invalid Payment Saving Failed'
						);
						console.log(err);
					} else {
						console.log(
							response.val_id +
								' - WARNING: Invalid Payment Saved For Investigation'
						);
						console.log(payment);
					}
				});
			},
			function (err) {
				console.log(response.val_id + ' - ERROR: System Log Failed');
				console.log(err);
			}
		);
};
var activateUserProduct = function (response, payment) {
	var oldDoc = Object.assign({}, payment);
	payment.active = false;
	payment.store_amount = parseFloat(response.store_amount);
	payment.tran_date = new Date(response.tran_date).getTime();
	payment.val_id = response.val_id;
	payment.card_type = response.card_type;
	payment.card_no = response.card_no;
	payment.currency = response.currency;
	payment.bank_tran_id = response.bank_tran_id;
	payment.card_issuer = response.card_issuer;
	payment.card_brand = response.card_brand;
	payment.card_issuer_country = response.card_issuer_country;
	payment.card_issuer_country_code = response.card_issuer_country_code;
	// Create log
	var newDoc = Object.assign({}, payment);
	var details = 'Payment completed';
	var appName = 'NONE';
	var appKey = 'NONE';
	log
		.create(
			'update',
			details,
			'Payment',
			oldDoc,
			newDoc,
			appName,
			appKey,
			'NONE',
			'System'
		)
		.then(
			function (tLog) {
				payment.updates.push({
					dateTime: dateTime.now(),
					member_id: 'NONE',
					memberType: 'System',
					log_id: tLog._id
				});
				// save the payment
				payment.save(function (err, sPayment) {
					if (err) {
						console.log(response.val_id + ' - ERROR: Payment update failed');
						console.log(err);
						saveNullPayment(response, payment.storeName);
					} else {
						UserProduct.findById(
							sPayment.userProduct_id,
							function (err, userProduct) {
								if (err) {
									console.log(
										response.val_id + ' - ERROR: Policy fetching failed'
									);
									console.log(err);
								} else if (!userProduct) {
									console.log(response.val_id + ' - ERROR: Policy not found');
								}
								var oldUserProduct = Object.assign({}, userProduct);
								userProduct.active = true;
								userProduct.payment.dateTime = sPayment.tran_date;
								userProduct.payment.method = sPayment.card_type;
								userProduct.payment.transactionId = sPayment.bank_tran_id;
								userProduct.payment.accountNo = sPayment.card_no;
								userProduct.payment.source = sPayment.card_issuer;
								userProduct.payment.gateway = sPayment.card_brand;
								userProduct.payment.log_id = tLog._id;
								// Create log
								var newUserProduct = Object.assign({}, userProduct);
								var details = 'UserProduct activated';
								var appName = 'NONE';
								var appKey = 'NONE';
								log
									.create(
										'update',
										details,
										'UserProduct',
										oldUserProduct,
										newUserProduct,
										appName,
										appKey,
										'NONE',
										'System'
									)
									.then(
										function (pLog) {
											userProduct.updates.push({
												dateTime: dateTime.now(),
												member_id: 'NONE',
												memberType: 'System',
												log_id: pLog._id
											});
											// save the policy
											userProduct.save(function (err, sUserProduct) {
												if (err) {
													console.log(
														response.val_id +
															' - ERROR: Policy update upon' +
															' activation failed'
													);
													console.log(err);
												} else {
													console.log(
														response.val_id + ' - SUCCESS: Policy Activated'
													);
													console.log(sUserProduct);
													if (sUserProduct.user_id) {
														// Activate user
														activateUser(sUserProduct.user_id);
														// Notify user about payment
														notifyUser(sUserProduct);
													}
												}
											});
										},
										function (err) {
											console.log(
												response.val_id + ' - ERROR: System Log Failed'
											);
											console.log(err);
										}
									);
							}
						);
					}
				});
			},
			function (err) {
				console.log(response.val_id + ' - ERROR: System Log Failed');
				console.log(err);
				saveNullPayment(response, payment.storeName);
			}
		);
};
var activateUser = function (id) {
	console.log(id + ' - LOG: Checking User for activation');
	User.findById(id, function (err, user) {
		if (err) {
			console.log(id + ' - ERROR: User fetching failed');
			console.log(err);
		} else if (!user) {
			console.log(id + ' - ERROR: User not found');
		} else if (user.active) {
			console.log(id + ' - SUCCESS: User is already active');
		} else {
			console.log(id + ' - LOG: Activating User');
			var oldUser = Object.assign({}, user);
			user.active = true;
			var newUser = Object.assign({}, user);
			var details = 'User activated';
			var appName = 'NONE';
			var appKey = 'NONE';
			log
				.create(
					'update',
					details,
					'User',
					oldUser,
					newUser,
					appName,
					appKey,
					'NONE',
					'System'
				)
				.then(
					function (uLog) {
						user.updates.push({
							dateTime: dateTime.now(),
							member_id: 'NONE',
							memberType: 'System',
							log_id: uLog._id
						});
						user.save(function (err, sUser) {
							if (err) {
								console.log(id + ' - ERROR: User updating failed');
								console.log(err);
							} else {
								console.log(id + ' - SUCCESS: User activated');
							}
						});
					},
					function (err) {
						console.log(response.val_id + ' - ERROR: System Log Failed');
						console.log(err);
					}
				);
		}
	});
};
var notifyUser = function (userProduct) {
	console.log(
		userProduct.user_id + ' - LOG: Sending Payment Confirmation Notification'
	);
	User.findById(userProduct.user_id, async function (err, user) {
		if (err) {
			console.log(userProduct.user_id + ' - ERROR: User fetching failed');
			console.log(err);
		} else if (!user) {
			console.log(userProduct.user_id + ' - ERROR: User not found');
		} else if (user.idType === 'mobileNo') {
			// Send SMS
			var message = '';
			message += 'Muhtaram,\n';
			message += `We just have received your gift with amount of BDT ${userProduct.amount}. Sign In to see all your donations and more\n`;
			message += 'https://cutt.ly/ZkTOjkP\n';
			message += 'As-Sunnah Foundation';
			sms.sendSingle(user.id, message).then(
				function () {
					// create log
					var oldDoc = {};
					var newDoc = {
						message: message
					};
					var details =
						'Sent donation confirmation notification to, ' + user.id;
					var appName = 'NONE';
					var appKey = 'NONE';
					var member_id = 'NONE';
					log
						.create(
							'create',
							details,
							'SMS',
							oldDoc,
							newDoc,
							appName,
							appKey,
							member_id,
							'System'
						)
						.then(
							function () {
								console.log(
									`${userProduct.user_id} - SUCCESS: Notified ${user.id} about successful donation payment`
								);
							},
							function (err) {
								console.error(err);
							}
						);
				},
				function (err) {
					console.error(err);
				}
			);
		} else {
			// Send Email
			var params = {
				baseUrl: sAdmin.verificationDomain,
				name: user.fullname ? user.fullname : undefined,
				amount: userProduct.amount
			};
			var emailHtml = await ejs.renderFile(
				'templates/paymentReceivedEmail.html',
				params
			);
			var emailSub = 'You just made a contribution!';
			mailer.sendHtml(user.id, emailSub, emailHtml).then(
				function () {
					console.log(
						`${userProduct.user_id} - SUCCESS: Notified ${user.id} about successful donation payment`
					);
				},
				function (err) {
					console.error(err);
				}
			);
		}
	});
};

// Product
router.route('/confirm').post(function (req, res) {
	if (!req.body.store_id) {
		return res.status(200).send({
			state: 'failure',
			message: 'Oh boy !!! Do your homework'
		});
	}
	const sslStore = butterflySecret.paymentGateway.stores.find(
		item => item.store_id === req.body.store_id
	);
	if (!sslStore) {
		return res.status(200).send({
			state: 'failure',
			message: "Nice try !!! But don't waste your time"
		});
	}
	res.status(200).send({
		state: 'success',
		message: 'Payment is being validated'
	});
	var options = {
		method: 'GET',
		uri:
			butterflySecret.paymentGateway.base_url +
			'/validator/api/validationserverAPI.php?val_id=' +
			req.body.val_id +
			'&store_id=' +
			sslStore.store_id +
			'&store_passwd=' +
			sslStore.store_passwd +
			'&format=json',
		headers: {
			'Content-Type': 'application/json'
		}
	};
	rp(options)
		.then(function (resp) {
			var response = JSON.parse(resp);
			console.log(response.val_id + ' - LOG: Started Payment Process');
			console.log(response);
			if (response.status === 'VALID') {
				if (mongoose.Types.ObjectId.isValid(response.tran_id)) {
					Payment.findOne(
						{
							_id: mongoose.Types.ObjectId(response.tran_id),
							amount: parseFloat(response.amount)
						},
						function (err, payment) {
							if (err) {
								console.log(
									response.val_id + ' - ERROR: Payment fetching failed'
								);
								console.log(err);
								saveNullPayment(response, sslStore.storeName);
							} else if (!payment) {
								console.log(response.val_id + ' - FAILURE: Payment not found');
								saveNullPayment(response, sslStore.storeName);
							} else if (!payment.active) {
								console.log(response.val_id + ' - FAILURE: Payment not active');
								saveNullPayment(response, sslStore.storeName);
							} else {
								// Proceed
								activateUserProduct(response, payment);
							}
						}
					);
				} else {
					console.log(response.val_id + ' - FAILURE: Invalid payment id');
					saveNullPayment(response, sslStore.storeName);
				}
			} else {
				console.log(
					response.val_id + ' - FAILURE: Payment status is, ' + response.status
				);
			}
		})
		.catch(function (err) {
			console.log(
				response.val_id + " - ERROR: Couldn't communicate SSLCommerz"
			);
			console.log(err);
		});
});

module.exports = router;
