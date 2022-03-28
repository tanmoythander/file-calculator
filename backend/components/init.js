/* eslint-disable no-console */
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var schedule = require('node-schedule');
var rp = require('request-promise');
var ejs = require('ejs');
var dateTime = require('./dateTime');
var mailer = require('./mailer');
var cuttly = require('./cuttly');
var hash = require('./hash');
var log = require('./log');
var sms = require('./sms-ssl-wireless-v3');
var sAdmin = require('./../secrets/superAdmin');
var butterflySecret = require('./../secrets/butterfly');

// Models
var SuperAdmin = mongoose.model('SuperAdmin');
var User = mongoose.model('User');
var UserProduct = mongoose.model('UserProduct');
var Payment = mongoose.model('Payment');
var Subscription = mongoose.model('Subscription');

// var renewalNotifyDays = process.env.PRODUCTION
// 	? [0, 1, 8, 15, 22, 29] : [
// 		0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 355, 356, 357,
// 		358, 359, 360, 361, 362, 363, 364, 365, 366
// 	];
// var expiredPolicyNotifyDays = process.env.PRODUCTION
// 	? [1, 8, 15, 22, 29] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var pendingPaymentNotifyDays = process.env.PRODUCTION ? [7] : [0, 1, 2];

var subscriptionIntervalDays = process.env.PRODUCTION
	? [30, 60, 90, 120, 150, 180]
	: [0, 1, 2];

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
													// Activate user
													if (sUserProduct.user_id) {
														activateUser(sUserProduct.user_id);
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
						// eslint-disable-next-line no-unused-vars
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

function notifyPendingPayments() {
	console.log(
		'NOTIFY_BOT: Started Notifying Pending Payments\n- ' +
			new Date().toLocaleString()
	);

	UserProduct.find(
		{
			'created.dateTime': {
				$gte: dateTime.today() - 29 * 24 * 60 * 60 * 1000
			},
			user_id: {
				$exists: true
			},
			'payment.dateTime': {
				$exists: false
			}
		},
		function (err, userProducts) {
			if (err) {
				console.error(err);
			} else if (userProducts.length > 0) {
				// filter in payments that can be notified
				var eligibleUserProducts = userProducts.filter(function (item) {
					return (
						pendingPaymentNotifyDays.indexOf(
							(dateTime.today() - dateTime.thatDay(item.created.dateTime)) /
								(1000 * 60 * 60 * 24)
						) > -1
					);
				});
				if (eligibleUserProducts.length > 0) {
					// get the users
					User.find(
						{
							_id: {
								$in: eligibleUserProducts.map(function (item) {
									return mongoose.Types.ObjectId(item.user_id);
								})
							}
						},
						function (err, users) {
							if (err) {
								console.error(err);
							} else {
								// sort by user
								var notifications = [];
								eligibleUserProducts.forEach(function (upItem) {
									var index = notifications.indexOf(
										notifications.find(function (nItem) {
											return nItem.user._id.toString() === upItem.user_id;
										})
									);
									if (index < 0) {
										notifications.push({
											user: users.find(function (uItem) {
												return uItem._id.toString() === upItem.user_id;
											}),
											userProducts: [upItem]
										});
									} else {
										notifications[index].userProducts.push(upItem);
									}
								});
								notifications.forEach(async function (notification) {
									const name = notification.user.fullname
										? notification.user.fullname
										: undefined;
									const count = notification.userProducts.length;
									const totalAmount = notification.userProducts.reduce(
										function (collector, nUserProduct) {
											return collector + nUserProduct.amount;
										},
										0
									);
									if (notification.user.idType === 'mobileNo') {
										// Send SMS
										var message = '';
										message += 'Muhtaram,\n';
										message += `Please Sign In to complete your ${count} pending payment${
											count > 1 ? 's' : ''
										} with amount of${
											count > 1 ? ' total' : ''
										} BDT ${totalAmount}\n`;
										message += 'https://cutt.ly/ZkTOjkP\n';
										message += 'As-Sunnah Foundation';
										sms.sendSingle(notification.user.id, message).then(
											function () {
												// create log
												var oldDoc = {};
												var newDoc = {
													message: message
												};
												var details =
													'Sent pending payment notification to, ' +
													notification.user.id;
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
																`Notified ${notification.user.id} about pending donation payment`
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
											name: name,
											count: count,
											amount: totalAmount
										};
										var emailHtml = await ejs.renderFile(
											'templates/paymentPendingEmail.html',
											params
										);
										var emailSub = 'Help us make a difference today !';
										mailer
											.sendHtml(notification.user.id, emailSub, emailHtml)
											.then(
												function () {
													console.log(
														`Notified ${notification.user.id} about pending donation payment`
													);
												},
												function (err) {
													console.error(err);
												}
											);
									}
								});
							}
						}
					);
				}
			}
		}
	);
}

function notifySubscribedPayments() {
	console.log(
		'NOTIFY_BOT: Started Notifying Subscribed Payments\n- ' +
			new Date().toLocaleString()
	);

	Subscription.find(
		{
			active: true,
			notification: true
		},
		function (err, subscriptions) {
			if (err) {
				console.error(err);
			} else if (subscriptions.length > 0) {
				const totalSubscriptions = subscriptions.length;
				var checkedSubscriptions = 0;
				var notifications = [];
				subscriptions.forEach(function (subscription) {
					var query = UserProduct.find(
						{
							user_id: subscription.user_id,
							product_id: subscription.product_id,
							active: true,
							'payment.dateTime': { $exists: true }
						},
						function (err, userProducts) {
							if (err) {
								console.error(err);
							} else if (userProducts.length > 0) {
								var today = dateTime.today();
								var thatDay = dateTime.thatDay(
									userProducts[0].payment.dateTime
								);
								var dayCount = (today - thatDay) / (24 * 60 * 60 * 1000);
								if (subscriptionIntervalDays.indexOf(dayCount) > -1) {
									User.findById(subscription.user_id, function (err, user) {
										if (err) {
											console.error(err);
										} else if (user) {
											notifications.push({
												user: user,
												subscription: subscription
											});
											checkedSubscriptions++;
											if (checkedSubscriptions === totalSubscriptions) {
												processSubscribedNotifications(notifications);
											}
										} else {
											checkedSubscriptions++;
											if (checkedSubscriptions === totalSubscriptions) {
												processSubscribedNotifications(notifications);
											}
										}
									});
								} else {
									checkedSubscriptions++;
									if (checkedSubscriptions === totalSubscriptions) {
										processSubscribedNotifications(notifications);
									}
								}
							} else {
								checkedSubscriptions++;
								if (checkedSubscriptions === totalSubscriptions) {
									processSubscribedNotifications(notifications);
								}
							}
						}
					);
					query.sort('-payment.dateTime');
					query.limit(1);
					assert.ok(query.exec() instanceof require('q').makePromise);
				});
			}
		}
	);
}

function processSubscribedNotifications(notifications) {
	notifications.forEach(async function (notification) {
		const name = notification.user.fullname
			? notification.user.fullname
			: undefined;
		if (notification.user.idType === 'mobileNo') {
			cuttly
				.shortenURL(
					`${sAdmin.verificationDomain}/donate/${notification.subscription.product_id}`
				)
				.then(
					function (shortURL) {
						// Send SMS
						var message = '';
						message += 'Muhtaram,\n';
						// eslint-disable-next-line max-len
						message += `Please click the link below to complete your monthly donation with amount of BDT ${notification.subscription.amount}\n`;
						message += `${shortURL}\n`;
						message += 'As-Sunnah Foundation';
						sms.sendSingle(notification.user.id, message).then(
							function () {
								// create log
								var oldDoc = {};
								var newDoc = {
									message: message
								};
								var details =
									'Sent donation subscription notification to, ' +
									notification.user.id;
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
												`Notified ${notification.user.id} about subscribed donation`
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
					},
					function (err) {
						console.error(err);
					}
				);
		} else {
			// Send Email
			var params = {
				baseUrl: sAdmin.verificationDomain,
				name: name,
				amount: notification.subscription.amount,
				product_id: notification.subscription.product_id
			};
			var emailHtml = await ejs.renderFile(
				'templates/subscriptionEmail.html',
				params
			);
			var emailSub = 'Your Donation brought a smile last time';
			mailer.sendHtml(notification.user.id, emailSub, emailHtml).then(
				function () {
					console.log(
						`Notified ${notification.user.id} about subscribed donation`
					);
				},
				function (err) {
					console.error(err);
				}
			);
		}
	});
}

function processMissingPayments() {
	console.log(
		'PAYMENT_BOT: Started Checking Missing Payments\n- ' +
			new Date().toLocaleString()
	);

	Payment.find(
		{
			active: true,
			'created.dateTime': {
				$gte: dateTime.today() - 15 * 24 * 60 * 60 * 1000
			}
		},
		function (err, payments) {
			if (err) {
				console.error(err);
			} else if (payments.length > 0) {
				console.log(
					`PAYMENT_BOT: Found ${payments.length} Pending Payments in Last 15 Days`
				);
				// match with active policies
				const totalPayments = payments.length;
				var completedCheckup = 0;
				var pendingPayments = [];
				payments.forEach(paymentItem => {
					UserProduct.findOne(
						{
							_id: mongoose.Types.ObjectId(paymentItem.userProduct_id),
							active: true
						},
						function (err, userProduct) {
							if (err) {
								console.error(err);
							} else if (userProduct) {
								pendingPayments.push({
									payment: paymentItem,
									userProduct: userProduct
								});
							}
							completedCheckup++;
							if (completedCheckup === totalPayments) {
								console.log(
									`PAYMENT_BOT: Found ${pendingPayments.length} Pending Payments Awaiting to be Paid`
								);
								if (pendingPayments.length > 0) {
									const totalPendingPayments = pendingPayments.length;
									var completedPendingCheckup = 0;
									var missingPayments = [];
									pendingPayments.forEach(pendingItem => {
										const sslStore = butterflySecret.paymentGateway.stores.find(
											item =>
												item.storeName === pendingItem.userProduct.storeName
										);
										// Check SSLCOMMERZ API
										const options = {
											method: 'GET',
											uri:
												butterflySecret.paymentGateway.base_url +
												'/validator/api/merchantTransIDvalidationAPI.php?store_id=' +
												sslStore.store_id +
												'&store_passwd=' +
												sslStore.store_passwd +
												'&tran_id=' +
												pendingItem.payment._id,
											headers: {
												'Content-Type': 'application/json'
											}
										};
										rp(options)
											.then(function (resp) {
												const response = JSON.parse(resp);
												if (
													response.APIConnect === 'DONE' &&
													response.no_of_trans_found > 0
													/*&& response.element[0].status === 'VALID'*/
												) {
													var responseIndex = response.element.indexOf(
														response.element.find(
															item => item.status === 'VALID'
														)
													);
													if (responseIndex > -1) {
														missingPayments.push({
															payment: pendingItem.payment,
															userProduct: pendingItem.userProduct,
															response: response.element[responseIndex]
														});
													}
												}
												completedPendingCheckup++;
												if (completedPendingCheckup === totalPendingPayments) {
													console.log(
														`PAYMENT_BOT: Found ${missingPayments.length} Missing Payments`
													);
													if (missingPayments.length > 0) {
														console.log(
															'PAYMENT_BOT: Completing Missing Payments Asynchronously'
														);
														missingPayments.forEach(missingPayment => {
															activateUserProduct(
																missingPayment.response,
																missingPayment.payment
															);
														});
														console.log(
															'PAYMENT_BOT: Checking Completed\n- ' +
																new Date().toLocaleString()
														);
													} else {
														console.log(
															'PAYMENT_BOT: Checking Completed\n- ' +
																new Date().toLocaleString()
														);
													}
												}
											})
											.catch(function (err) {
												console.error(err);
											});
									});
								} else {
									console.log(
										'PAYMENT_BOT: Checking Completed\n- ' +
											new Date().toLocaleString()
									);
								}
							}
						}
					);
				});
			} else {
				console.log('PAYMENT_BOT: Found 0 Pending Payments in Last 15 Days');
				console.log(
					'PAYMENT_BOT: Checking Completed\n- ' + new Date().toLocaleString()
				);
			}
		}
	);
}

module.exports = function (dbInfo) {
	// Start instance specific jobs
	if (process.env.NODE_APP_INSTANCE === '0') {

		// Set SuperAdmin
		SuperAdmin.find({}, function (err, superAdmins) {
			if (err) {
				console.log('Error finding Super Admin');
			} else if (superAdmins.length !== 0) {
				console.log('Super Admin exists');
				var superAdmin = superAdmins[0];
				superAdmin.username = sAdmin.username;
				superAdmin.password = hash.create(sAdmin.password);
				//superAdmin.collections = sAdmin.collections;
				// eslint-disable-next-line no-unused-vars
				superAdmin.save(function (err, result) {
					if (err) {
						console.log('Error updating Super Admin');
					} else {
						console.log('Super Admin updated');
					}
				});
			} else {
				var newSuperAdmin = new SuperAdmin();
				newSuperAdmin.username = sAdmin.username;
				newSuperAdmin.password = hash.create(sAdmin.password);
				newSuperAdmin.collections = sAdmin.collections;
				newSuperAdmin.createdAt = dateTime.now();
				// eslint-disable-next-line no-unused-vars
				newSuperAdmin.save(function (err, result) {
					if (err) {
						console.log('Error adding Super Admin');
					} else {
						console.log('Super Admin added');
					}
				});
			}
		});

		// notify dev team about production launch
		if (process.env.PRODUCTION) {
			var message = 'MongoDB connection status: Active<br>';
			message += 'MongoDB server version: ' + dbInfo.version;
			message += '<br>';
			message += '<br>Have a good day !!!';

			// send mail
			require('./mailer').sendInitMail(message);
		}

		console.log(
			'PAYMENT_BOT schedule started on instance ' +
				process.env.NODE_APP_INSTANCE
		);

		schedule.scheduleJob('0 4 * * *', processMissingPayments);
	} else if (process.env.NODE_APP_INSTANCE === '1') {
		console.log(
			'NOTIFY_BOT schedule started on instance ' + process.env.NODE_APP_INSTANCE
		);

		schedule.scheduleJob('30 11 * * *', notifyPendingPayments);
		schedule.scheduleJob('10 11 * * *', notifySubscribedPayments);
	}
};
