var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var rp = require('request-promise');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');
var parse = require('./../../../components/parse');
var validate = require('./../../../components/validate');
var butterflySecret = require('./../../../secrets/butterfly');

// Models
var UserProduct = mongoose.model('UserProduct');
var User = mongoose.model('User');
var Product = mongoose.model('Product');
var Subscription = mongoose.model('Subscription');
var Payment = mongoose.model('Payment');

function get(req, res) {
	UserProduct.findById(req.params.id, function (err, userProduct) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!userProduct) {
			return res.status(200).send({
				state: 'failure',
				message: 'UserProduct not found'
			});
		}
		return res.status(200).send({
			state: 'success',
			message: 'Returned UserProduct',
			userProduct: userProduct
		});
	});
}

function create(req, res) {
	// validation
	if (!req.body.product_id) {
		return res.status(200).send({
			state: 'failure',
			message: 'Product id is required'
		});
	}
	if (!req.body.amount) {
		return res.status(200).send({
			state: 'failure',
			message: 'Amount is required'
		});
	} else if (isNaN(parseInt(req.body.amount))) {
		return res.status(200).send({
			state: 'failure',
			message: 'backend.user.subscription.amount.is.invalid'
		});
	} else if (parseInt(req.body.amount) < 10) {
		return res.status(200).send({
			state: 'failure',
			message: 'backend.user.subscription.minimum.amount'
		});
	}
	if (req.body.phoneOrEmail) {
		if (
			!validate.phoneOrEmailExt(req.body.phoneOrEmail) &&
			!validate.phoneOrEmailExt('+88' + req.body.phoneOrEmail)
		) {
			return res.status(200).send({
				state: 'failure',
				message: 'Invalid mobile number or email address'
			});
		} else if (!validate.phoneOrEmailExt(req.body.phoneOrEmail)) {
			req.body.phoneOrEmail = '+88' + req.body.phoneOrEmail;
		}
	}

	Product.findOne(
		{
			_id: mongoose.Types.ObjectId(req.body.product_id),
			active: true
		},
		function (err, product) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!product) {
				return res.status(200).send({
					state: 'failure',
					message: 'Product not available'
				});
			} else if (product.amountIsFixed && !req.body.phoneOrEmail) {
				return res.status(200).send({
					state: 'failure',
					message: 'Mobile number or email address is required'
				});
			}
			if (!req.body.phoneOrEmail) {
				// Anonymous
				createUserProduct(undefined, product, req, res);
			} else {
				User.findOne(
					{
						id: req.body.phoneOrEmail
					},
					function (err, exstUser) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						/* eslint-disable no-console */
						if (exstUser) {
							// Amount Correction
							if (product.amountIsFixed) {
								Subscription.findOne(
									{
										product_id: product._id,
										user_id: exstUser._id,
										amount: { $exists: true },
										active: true
									},
									function (err, subscription) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}
										if (!subscription) {
											var newSubscription = new Subscription();
											newSubscription.product_id = product._id;
											newSubscription.user_id = exstUser._id;
											newSubscription.amount = req.body.amount;
											newSubscription.notification = true;
											// Create log
											var details = 'Added new subscription';
											var appName = req.decoded.appKey.name;
											var appKey = req.decoded.appKey.token;
											var member_id = exstUser._id;
											var memberType = 'User';
											log
												.create(
													'create',
													details,
													'Subscription',
													{},
													newSubscription,
													appName,
													appKey,
													member_id,
													memberType
												)
												.then(
													function (sLog) {
														newSubscription.created.dateTime = dateTime.now();
														newSubscription.created.member_id = member_id;
														newSubscription.created.memberType = memberType;
														newSubscription.created.log_id = sLog._id;
														// eslint-disable-next-line no-unused-vars
														newSubscription.save(function (
															err,
															savedSubscription
														) {
															if (err) {
																console.error(err);
															} else {
																console.log('User subscribed to product');
															}
														});
													},
													function (err) {
														console.error(err);
													}
												);
											createUserProduct(exstUser, product, req, res);
										} else {
											req.body.amount = subscription.amount;
											createUserProduct(exstUser, product, req, res);
										}
									}
								);
							} else {
								createUserProduct(exstUser, product, req, res);
							}
						} else {
							var newUser = new User();
							if (req.body.name) {
								newUser.fullname = req.body.name.toString().trim();
							}
							newUser.id = req.body.phoneOrEmail;
							newUser.idType = validate.phoneExt(req.body.phoneOrEmail)
								? 'mobileNo'
								: 'email';

							// Create log
							var details = 'Added new user';
							var appName = req.decoded.appKey.name;
							var appKey = req.decoded.appKey.token;
							var member_id = 'SELF';
							var memberType = 'User';
							log
								.create(
									'create',
									details,
									'User',
									{},
									newUser,
									appName,
									appKey,
									member_id,
									memberType
								)
								.then(
									function (uLog) {
										newUser.created.dateTime = dateTime.now();
										newUser.created.member_id = member_id;
										newUser.created.memberType = memberType;
										newUser.created.log_id = uLog._id;
										newUser.save(function (err, savedUser) {
											if (err) {
												return res.status(500).send({
													state: 'failure',
													message: 'database error',
													error: err
												});
											}
											if (product.amountIsFixed) {
												var newSubscription = new Subscription();
												newSubscription.product_id = product._id;
												newSubscription.user_id = savedUser._id;
												newSubscription.amount = req.body.amount;
												newSubscription.notification = true;
												// Create log
												var details = 'Added new subscription';
												var appName = req.decoded.appKey.name;
												var appKey = req.decoded.appKey.token;
												var member_id = savedUser._id;
												var memberType = 'User';
												log
													.create(
														'create',
														details,
														'Subscription',
														{},
														newSubscription,
														appName,
														appKey,
														member_id,
														memberType
													)
													.then(
														function (sLog) {
															newSubscription.created.dateTime = dateTime.now();
															newSubscription.created.member_id = member_id;
															newSubscription.created.memberType = memberType;
															newSubscription.created.log_id = sLog._id;
															// eslint-disable-next-line no-unused-vars
															newSubscription.save(function (
																err,
																savedSubscription
															) {
																if (err) {
																	console.error(err);
																} else {
																	console.log('User subscribed to product');
																}
															});
														},
														function (err) {
															console.error(err);
														}
													);
											}
											createUserProduct(savedUser, product, req, res);
										});
									},
									function (err) {
										return res.status(500).send({
											state: 'failure',
											message: 'database error',
											error: err
										});
									}
								);
						}
						/* eslint-enable no-console */
					}
				);
			}
		}
	);
}

function pay(req, res) {
	UserProduct.findOne(
		{
			_id: mongoose.Types.ObjectId(req.params.id),
			active: false
		},
		function (err, userProduct) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!userProduct) {
				return res.status(200).send({
					state: 'failure',
					message: 'UserProduct not found'
				});
			}
			if (userProduct.payment.dateTime) {
				return res.status(200).send({
					state: 'failure',
					message: 'UserProduct already purchased'
				});
			}
			Product.findOne(
				{
					_id: mongoose.Types.ObjectId(userProduct.product_id),
					active: true
				},
				function (err, product) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					if (!product) {
						return res.status(200).send({
							state: 'failure',
							message: 'Product not available'
						});
					}
					if (userProduct.user_id) {
						User.findOne(
							{
								_id: mongoose.Types.ObjectId(userProduct.user_id)
							},
							function (err, user) {
								if (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								if (!user) {
									return res.status(200).send({
										state: 'failure',
										message: 'User not available'
									});
								}
								retryUserProductPayment(user, userProduct, res);
							}
						);
					} else {
						retryUserProductPayment(undefined, userProduct, res);
					}
				}
			);
		}
	);
}

// Helper Functions
function createUserProduct(user, product, req, res) {
	var newUserProduct = new UserProduct();
	if (user) {
		newUserProduct.user_id = user._id;
	}
	newUserProduct.product_id = product._id;
	newUserProduct.name = product.name;
	newUserProduct.description = product.description;
	newUserProduct.productType = product.productType;
	newUserProduct.storeName = product.storeName;
	newUserProduct.primaryBanner = product.primaryBanner;
	newUserProduct.secondaryBanner = product.secondaryBanner;
	newUserProduct.notifyIntervalDays = product.notifyIntervalDays;
	newUserProduct.amountIsFixed = product.amountIsFixed;
	newUserProduct.amount = req.body.amount;
	// fill up fixed values
	var fixedParams = product.productConfig.filter(function (item) {
		return item.paramValue.length !== 0;
	});
	for (fixedParam of fixedParams) {
		newUserProduct.productParams.push({
			param_id: fixedParam.param_id,
			paramName: fixedParam.paramName,
			paramValue: fixedParam.paramValue,
			paramSource: fixedParam.paramSource
		});
	}
	// fill up input values
	var activeParams = product.productConfig.filter(function (item) {
		return item.paramValue.length === 0;
	});
	// process params
	for (activeParam of activeParams) {
		// validate the values
		var productParam = req.body.productParams.find(function (item) {
			if (
				!item.paramName ||
				!item.paramValue ||
				item.paramName.toString().trim() !== activeParam.paramName
			) {
				return false;
			} else {
				// param with value found !!!
				if (activeParam.paramType === 'string') {
					// type is string
					// check length or enums if validation exists
					if (
						(activeParam.paramMinLen !== 0 || activeParam.paramMaxLen !== 0) &&
						(item.paramValue.length < activeParam.paramMinLen ||
							item.paramValue.length > activeParam.paramMaxLen)
					) {
						return false;
					} else if (
						activeParam.paramEnums.length > 0 &&
						activeParam.paramEnums.indexOf(item.paramValue.toString().trim()) <
							0
					) {
						return false;
					} else {
						return true;
					}
				} else if (activeParam.paramType === 'number') {
					// type is number
					// check values if validation exists
					if (
						isNaN(parseFloat(item.paramValue)) ||
						((activeParam.paramMin !== 0 || activeParam.paramMax !== 0) &&
							(parseFloat(item.paramValue) < activeParam.paramMin ||
								parseFloat(item.paramValue) > activeParam.paramMax))
					) {
						return false;
					} else {
						return true;
					}
				} else if (activeParam.paramType === 'boolean') {
					if (
						item.paramValue.toString().trim() !== 'true' &&
						item.paramValue.toString().trim() !== 'false'
					) {
						return false;
					} else {
						return true;
					}
				} else if (activeParam.paramType === 'date') {
					if (isNaN(parseInt(item.paramValue))) {
						return false;
					} else {
						return true;
					}
				} else if (activeParam.paramType === 'file') {
					return true;
				} else {
					return false;
				}
			}
		});
		if (!productParam && activeParam.paramRequired) {
			// required param is invalid
			return res.status(200).send({
				state: 'failure',
				message: 'backend.public.userProduct.invalid.product.parameter'
			});
		} else if (productParam) {
			// required param is valid
			// push an object to new user profile params
			var newUserProductParam = {
				param_id: activeParam.param_id,
				paramName: activeParam.paramName,
				paramValue: productParam.paramValue.toString().trim()
			};
			if (activeParam.paramType === 'file' && productParam.paramSource) {
				newUserProductParam.paramSource = productParam.paramSource
					.toString()
					.trim();
			}
			newUserProduct.productParams.push(newUserProductParam);
		}
	}
	// Create log
	var details = `${
		user ? 'User' : 'Someone'
	} initiated a new UserProduct purchase`;
	var appName = req.decoded.appKey.name;
	var appKey = req.decoded.appKey.token;
	var member_id = user ? user._id : 'UNKNOWN';
	var memberType = user ? 'User' : 'Public';
	log
		.create(
			'create',
			details,
			'UserProduct',
			{},
			newUserProduct,
			appName,
			appKey,
			member_id,
			memberType
		)
		.then(
			function (log) {
				newUserProduct.created.dateTime = dateTime.now();
				newUserProduct.created.member_id = member_id;
				newUserProduct.created.memberType = memberType;
				newUserProduct.created.log_id = log._id;
				newUserProduct.save(function (err, userProduct) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					// Register new payment
					var newPayment = new Payment();
					if (user) {
						newPayment.user_id = user._id;
					}
					newPayment.userProduct_id = userProduct._id;
					newPayment.storeName = userProduct.storeName;
					newPayment.amount = userProduct.amount;
					newPayment.appName = req.decoded.appKey.name;
					newPayment.created.dateTime = dateTime.now();
					newPayment.created.member_id = member_id;
					newPayment.created.memberType = memberType;
					newPayment.created.log_id = log._id;
					newPayment.save(function (err, payment) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						// Update the userProduct
						UserProduct.findById(
							userProduct._id,
							function (err, toBeUpdatedUserProduct) {
								if (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								toBeUpdatedUserProduct.payment.payment_id = payment._id;
								toBeUpdatedUserProduct.save(function (err, userProduct) {
									if (err) {
										return res.status(500).send({
											state: 'failure',
											message: 'database error',
											error: err
										});
									}
									// Fetch store info
									var sslStore = butterflySecret.paymentGateway.stores.find(
										function (item) {
											return item.storeName === payment.storeName;
										}
									);
									// Initiate the payment
									var options = {
										method: 'POST',
										uri:
											butterflySecret.paymentGateway.base_url +
											'/gwprocess/v4/api.php',
										formData: {
											store_id: sslStore.store_id,
											store_passwd: sslStore.store_passwd,
											total_amount: userProduct.amount.toString(),
											currency: 'BDT',
											tran_id: payment._id.toString(),
											ipn_url: butterflySecret.paymentGateway.ipn_url,
											success_url:
												butterflySecret.paymentGateway.success_url +
												'/' +
												userProduct._id,
											fail_url:
												butterflySecret.paymentGateway.fail_url +
												'/' +
												userProduct._id,
											cancel_url:
												butterflySecret.paymentGateway.cancel_url +
												'/' +
												userProduct._id,
											cus_name:
												user && user.fullname ? user.fullname : 'John Doe',
											cus_email:
												user && user.idType === 'email'
													? user.id
													: 'dev@quanticdynamics.com',
											cus_add1: 'Dhaka',
											cus_city: 'Dhaka',
											cus_state: 'Bangladesh',
											cus_postcode: '1206',
											cus_country: 'Bangladesh',
											cus_phone:
												user && user.idType === 'mobileNo'
													? user.id
													: '+8809611886797',
											cus_fax:
												user && user.idType === 'mobileNo'
													? user.id
													: '+8809611886797',
											shipping_method: 'NO',
											product_name: product.name,
											product_category: 'Donation',
											product_profile: 'non-physical-goods'
										},
										headers: {
											'Content-Type': 'application/json'
										}
									};
									rp(options)
										.then(function (resp) {
											var response = JSON.parse(resp);
											if (response.status !== 'SUCCESS') {
												return res.status(200).send({
													state: 'failure',
													message: 'UserProduct purchase initialisation failed',
													userProduct: parse.userProduct(userProduct)
												});
											}
											return res.status(200).send({
												state: 'success',
												message:
													'UserProduct purchase initialised successfully',
												userProduct: parse.userProduct(userProduct),
												paymentGatewayUrl: response.GatewayPageURL
											});
										})
										.catch(function (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										});
								});
							}
						);
					});
				});
			},
			function (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
		);
}

function retryUserProductPayment(user, userProduct, res) {
	// Fetch store info
	var sslStore = butterflySecret.paymentGateway.stores.find(function (item) {
		return item.storeName === userProduct.storeName;
	});
	// Initiate the payment
	var options = {
		method: 'POST',
		uri: butterflySecret.paymentGateway.base_url + '/gwprocess/v4/api.php',
		formData: {
			store_id: sslStore.store_id,
			store_passwd: sslStore.store_passwd,
			total_amount: userProduct.amount.toString(),
			currency: 'BDT',
			tran_id: userProduct.payment.payment_id,
			ipn_url: butterflySecret.paymentGateway.ipn_url,
			success_url:
				butterflySecret.paymentGateway.success_url + '/' + userProduct._id,
			fail_url: butterflySecret.paymentGateway.fail_url + '/' + userProduct._id,
			cancel_url:
				butterflySecret.paymentGateway.cancel_url + '/' + userProduct._id,
			cus_name: user && user.fullname ? user.fullname : 'John Doe',
			cus_email:
				user && user.idType === 'email' ? user.id : 'dev@quanticdynamics.com',
			cus_add1: 'Dhaka',
			cus_city: 'Dhaka',
			cus_state: 'Bangladesh',
			cus_postcode: '1206',
			cus_country: 'Bangladesh',
			cus_phone:
				user && user.idType === 'mobileNo' ? user.id : '+8809611886797',
			cus_fax: user && user.idType === 'mobileNo' ? user.id : '+8809611886797',
			shipping_method: 'NO',
			product_name: userProduct.name,
			product_category: 'Donation',
			product_profile: 'non-physical-goods'
		},
		headers: {
			'Content-Type': 'application/json'
		}
	};
	rp(options)
		.then(function (resp) {
			var response = JSON.parse(resp);
			if (response.status !== 'SUCCESS') {
				return res.status(200).send({
					state: 'failure',
					message: 'UserProduct payment initialisation failed',
					userProduct: parse.userProduct(userProduct)
				});
			}
			return res.status(200).send({
				state: 'success',
				message: 'UserProduct payment info returned',
				userProduct: parse.userProduct(userProduct),
				paymentGatewayUrl: response.GatewayPageURL
			});
		})
		.catch(function (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		});
}

module.exports = {
	get,
	create,
	pay
};
