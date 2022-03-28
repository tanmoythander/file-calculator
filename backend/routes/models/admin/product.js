var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var role = require('./../../../components/role');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');
var butterflySecret = require('./../../../secrets/butterfly');

// Models
var Product = mongoose.model('Product');
var ProductParam = mongoose.model('ProductParam');

// Functions
function create(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Product', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	// validation
	if (!req.body.name) {
		return res.status(200).send({
			state: 'failure',
			message: 'name is required'
		});
	}
	if (!req.body.productType) {
		return res.status(200).send({
			state: 'failure',
			message: 'productType is required'
		});
	}
	if (!req.body.storeName) {
		return res.status(200).send({
			state: 'failure',
			message: 'storeName is required'
		});
	} else if (
		!butterflySecret.paymentGateway.stores.find(
			item => item.storeName === req.body.storeName
		)
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'storeName is invalid'
		});
	}
	if (!req.body.primaryBanner) {
		return res.status(200).send({
			state: 'failure',
			message: 'primaryBanner is required'
		});
	}
	Product.findOne(
		{
			name: req.body.name.toString().trim(),
			productType: req.body.name.toString().trim(),
			active: true
		},
		function (err, exstProduct) {
			if (err) {
				return res.status(200).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			// exists already
			if (exstProduct) {
				return res.status(200).send({
					state: 'failure',
					message: req.body.name.toString().trim() + ', product already exists'
				});
			}
			// create log data
			var details = 'Created product';
			var appName = req.decoded.appKey.name;
			var appKey = req.decoded.appKey.token;
			var member_id = req.decoded.admin
				? req.decoded.admin._id
				: req.decoded.superAdmin._id;
			var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';

			// create the product
			var newProduct = new Product();
			newProduct.name = req.body.name.toString().trim();
			newProduct.productType = req.body.productType.toString().trim();
			newProduct.storeName = req.body.storeName;
			newProduct.primaryBanner = req.body.primaryBanner.toString().trim();

			if (req.body.secondaryBanner) {
				newProduct.secondaryBanner = req.body.secondaryBanner.toString().trim();
			}
			if (req.body.description) {
				newProduct.description = req.body.description.toString().trim();
			}
			if (
				req.body.notifyIntervalDays &&
				!isNaN(parseInt(req.body.notifyIntervalDays))
			) {
				newProduct.notifyIntervalDays = parseInt(req.body.notifyIntervalDays);
			}
			if (req.body.amountIsFixed) {
				newProduct.amountIsFixed = req.body.amountIsFixed;
			}

			// fill out create log, except log_id
			newProduct.created.dateTime = dateTime.now();
			newProduct.created.member_id = member_id;
			newProduct.created.memberType = memberType;

			if (!req.body.productConfig || req.body.productConfig.length === 0) {
				log
					.create(
						'create',
						details,
						'Product',
						{},
						newProduct,
						appName,
						appKey,
						member_id,
						memberType
					)
					.then(
						function (pLog) {
							newProduct.created.log_id = pLog._id;
							// submit to database
							newProduct.save(function (err, product) {
								if (err) {
									return res.status(200).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								return res.status(200).send({
									state: 'success',
									message: 'Product created successfully',
									product: product
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
			} else {
				// process config and submit to database
				var params = req.body.productConfig.filter(function (item) {
					return item.paramName;
				});
				if (params.length < 1) {
					log
						.create(
							'create',
							details,
							'Product',
							{},
							newProduct,
							appName,
							appKey,
							member_id,
							memberType
						)
						.then(
							function (pLog) {
								newProduct.created.log_id = pLog._id;
								// submit to database
								newProduct.save(function (err, product) {
									if (err) {
										return res.status(200).send({
											state: 'failure',
											message: 'database error',
											error: err
										});
									}
									return res.status(200).send({
										state: 'success',
										message: 'Product created successfully',
										product: product
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
				} else {
					// params are available
					var paramNames = params.map(function (item) {
						return item.paramName.toString().trim();
					});
					ProductParam.find(
						{
							paramName: {
								$in: paramNames
							}
						},
						function (err, productParams) {
							if (err) {
								return res.status(200).send({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							if (productParams.length < 1) {
								log
									.create(
										'create',
										details,
										'Product',
										{},
										newProduct,
										appName,
										appKey,
										member_id,
										memberType
									)
									.then(
										function (pLog) {
											newProduct.created.log_id = pLog._id;
											// submit to database
											newProduct.save(function (err, product) {
												if (err) {
													return res.status(200).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												}
												return res.status(200).send({
													state: 'success',
													message: 'Product created successfully',
													product: product
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
							} else {
								var productConfig = [];
								for (productParam of productParams) {
									var newProductParam = {
										param_id: productParam._id,
										paramName: productParam.paramName,
										paramType: productParam.paramType,
										paramEnums: productParam.paramEnums
									};
									var bodyParam = params.filter(function (item) {
										return (
											item.paramName.toString().trim() ===
											productParam.paramName
										);
									})[0];
									if (bodyParam) {
										if (bodyParam.paramValue) {
											newProductParam.paramValue = bodyParam.paramValue;
											if (
												bodyParam.paramSource &&
												newProductParam.paramType === 'file'
											) {
												newProductParam.paramSource = bodyParam.paramSource;
											}
										} else {
											if (bodyParam.paramRequired) {
												newProductParam.paramRequired = bodyParam.paramRequired;
											} else {
												newProductParam.paramRequired = false;
											}
											if (
												newProductParam.paramType === 'string' &&
												newProductParam.paramEnums !== [] &&
												bodyParam.paramMaxLen &&
												!isNaN(bodyParam.paramMaxLen) &&
												bodyParam.paramMaxLen > 0 &&
												bodyParam.paramMinLen &&
												!isNaN(bodyParam.paramMinLen) &&
												bodyParam.paramMinLen > 0
											) {
												// String with max min values
												newProductParam.paramMinLen = bodyParam.paramMinLen;
												newProductParam.paramMaxLen = bodyParam.paramMaxLen;
											} else if (
												newProductParam.paramType === 'number' &&
												bodyParam.paramMax &&
												!isNaN(bodyParam.paramMax) &&
												bodyParam.paramMax > 0 &&
												bodyParam.paramMin &&
												!isNaN(bodyParam.paramMin) &&
												bodyParam.paramMin > 0
											) {
												// Number with max min values
												newProductParam.paramMin = bodyParam.paramMin;
												newProductParam.paramMax = bodyParam.paramMax;
											}
										}
										productConfig.push(newProductParam);
									}
								}
								newProduct.productConfig = productConfig;
								log
									.create(
										'create',
										details,
										'Product',
										{},
										newProduct,
										appName,
										appKey,
										member_id,
										memberType
									)
									.then(
										function (pLog) {
											newProduct.created.log_id = pLog._id;
											// submit to database
											newProduct.save(function (err, product) {
												if (err) {
													return res.status(200).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												}
												return res.status(200).send({
													state: 'success',
													message: 'Product created successfully',
													product: product
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
						}
					);
				}
			}
		}
	);
}

function getAll(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Product', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = Product.find({}, function (err, products) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${products.length}) products`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'read',
				details,
				'Product',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			// eslint-disable-next-line
			.then(
				function () {},
				err => console.err(err)
			);
		return res.status(200).send({
			state: 'success',
			message: 'Returned all products',
			products: products
		});
	});
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function get(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Product', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Product.findById(req.params.id, function (err, product) {
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
				message: 'Product not found'
			});
		}
		// create log
		var details = `Read product with _id, ${req.params.id}`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'read',
				details,
				'Product',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			// eslint-disable-next-line
			.then(
				function () {},
				err => console.err(err)
			);
		return res.status(200).send({
			state: 'success',
			message: 'Returned product',
			product: product
		});
	});
}

function update(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Product', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Product.findById(req.params.id, function (err, exstProduct) {
		if (err) {
			return res.status(200).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// exists already
		if (!exstProduct) {
			return res.status(200).send({
				state: 'failure',
				message: 'Product not found'
			});
		}
		// create log data
		var oldDoc = Object.assign({}, exstProduct);
		var newDoc = {};
		var details = 'Updated product with _id, ' + req.params.id;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';

		if (req.body.description) {
			exstProduct.description = req.body.description.toString().trim();
		}
		if (req.body.primaryBanner) {
			exstProduct.primaryBanner = req.body.primaryBanner.toString().trim();
		}
		if (req.body.secondaryBanner) {
			exstProduct.secondaryBanner = req.body.secondaryBanner.toString().trim();
		}
		if (
			req.body.notifyIntervalDays &&
			!isNaN(parseInt(req.body.notifyIntervalDays))
		) {
			exstProduct.notifyIntervalDays = parseInt(req.body.notifyIntervalDays);
		}
		if (req.body.amountIsFixed) {
			exstProduct.amountIsFixed = req.body.amountIsFixed;
		}
		if (!req.body.productConfig || req.body.productConfig.length === 0) {
			newDoc = Object.assign({}, exstProduct);
			log
				.create(
					'update',
					details,
					'Product',
					oldDoc,
					newDoc,
					appName,
					appKey,
					member_id,
					memberType
				)
				.then(
					function (pLog) {
						exstProduct.updates.push({
							dateTime: dateTime.now(),
							member_id: member_id,
							memberType: memberType,
							log_id: pLog._id
						});
						// submit to database
						exstProduct.save(function (err, product) {
							if (err) {
								return res.status(200).send({
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							return res.status(200).send({
								state: 'success',
								message: 'Product updated successfully',
								product: product
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
		} else {
			// process config and submit to database
			var params = req.body.productConfig.filter(function (item) {
				return item.paramName;
			});
			if (params.length < 1) {
				newDoc = Object.assign({}, exstProduct);
				log
					.create(
						'Update',
						details,
						'Product',
						oldDoc,
						newDoc,
						appName,
						appKey,
						member_id,
						memberType
					)
					.then(
						function (pLog) {
							exstProduct.updates.push({
								dateTime: dateTime.now(),
								member_id: member_id,
								memberType: memberType,
								log_id: pLog._id
							});
							// submit to database
							exstProduct.save(function (err, product) {
								if (err) {
									return res.status(200).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								return res.status(200).send({
									state: 'success',
									message: 'Product updated successfully',
									product: product
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
			} else {
				// params are available
				var paramNames = params.map(function (item) {
					return item.paramName.toString().trim();
				});
				ProductParam.find(
					{
						paramName: {
							$in: paramNames
						}
					},
					function (err, productParams) {
						if (err) {
							return res.status(200).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						if (productParams.length < 1) {
							newDoc = Object.assign({}, exstProduct);
							log
								.create(
									'Update',
									details,
									'Product',
									oldDoc,
									newDoc,
									appName,
									appKey,
									member_id,
									memberType
								)
								.then(
									function (pLog) {
										exstProduct.updates.push({
											dateTime: dateTime.now(),
											member_id: member_id,
											memberType: memberType,
											log_id: pLog._id
										});
										// submit to database
										exstProduct.save(function (err, product) {
											if (err) {
												return res.status(200).send({
													state: 'failure',
													message: 'database error',
													error: err
												});
											}
											return res.status(200).send({
												state: 'success',
												message: 'Product updated successfully',
												product: product
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
						} else {
							var productConfig = [];
							for (productParam of productParams) {
								var newProductParam = {
									param_id: productParam._id,
									paramName: productParam.paramName,
									paramType: productParam.paramType,
									paramEnums: productParam.paramEnums
								};
								var bodyParam = params.filter(function (item) {
									return (
										item.paramName.toString().trim() === productParam.paramName
									);
								})[0];
								if (bodyParam) {
									if (bodyParam.paramValue) {
										newProductParam.paramValue = bodyParam.paramValue;
									} else {
										if (bodyParam.paramRequired) {
											newProductParam.paramRequired = bodyParam.paramRequired;
										} else {
											newProductParam.paramRequired = false;
										}
										if (
											newProductParam.paramType === 'string' &&
											newProductParam.paramEnums !== [] &&
											bodyParam.paramMaxLen &&
											!isNaN(bodyParam.paramMaxLen) &&
											bodyParam.paramMaxLen > 0 &&
											bodyParam.paramMinLen &&
											!isNaN(bodyParam.paramMinLen) &&
											bodyParam.paramMinLen > 0
										) {
											// String with max min values
											newProductParam.paramMinLen = bodyParam.paramMinLen;
											newProductParam.paramMaxLen = bodyParam.paramMaxLen;
										} else if (
											newProductParam.paramType === 'number' &&
											bodyParam.paramMax &&
											!isNaN(bodyParam.paramMax) &&
											bodyParam.paramMax > 0 &&
											bodyParam.paramMin &&
											!isNaN(bodyParam.paramMin) &&
											bodyParam.paramMin > 0
										) {
											// Number with max min values
											newProductParam.paramMin = bodyParam.paramMin;
											newProductParam.paramMax = bodyParam.paramMax;
										}
									}
									productConfig.push(newProductParam);
								}
							}
							exstProduct.productConfig = productConfig;
							newDoc = Object.assign({}, exstProduct);
							log
								.create(
									'Update',
									details,
									'Product',
									oldDoc,
									newDoc,
									appName,
									appKey,
									member_id,
									memberType
								)
								.then(
									function (pLog) {
										exstProduct.updates.push({
											dateTime: dateTime.now(),
											member_id: member_id,
											memberType: memberType,
											log_id: pLog._id
										});
										// submit to database
										exstProduct.save(function (err, product) {
											if (err) {
												return res.status(200).send({
													state: 'failure',
													message: 'database error',
													error: err
												});
											}
											return res.status(200).send({
												state: 'success',
												message: 'Product updated successfully',
												product: product
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
					}
				);
			}
		}
	});
}

function deactivate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Product', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Product.findById(req.params.id, function (err, product) {
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
				message: 'Product not found'
			});
		}
		if (!product.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Product already inactive'
			});
		}
		var oldDoc = Object.assign({}, product);
		product.active = false;
		// create log
		var newDoc = Object.assign({}, product);
		var details = 'Deactivated product with _id, ' + req.params.id;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'Update',
				details,
				'Product',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (pLog) {
					product.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: pLog._id
					});
					product.save(function (err, product) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Product deactivated successfully',
							product: product
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
	});
}

function activate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Product', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Product.findById(req.params.id, function (err, product) {
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
				message: 'Product not found'
			});
		}
		if (product.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Product already active'
			});
		}
		Product.findOne(
			{
				name: req.body.name.toString().trim(),
				group: req.body.group.toString().trim(),
				subGroup: req.body.subGroup.toString().trim(),
				active: true
			},
			function (err, activeProduct) {
				if (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (activeProduct) {
					return res.status(200).send({
						state: 'failure',
						message: 'Same product already active'
					});
				}
				var oldDoc = Object.assign({}, product);
				product.active = true;
				// create log
				var newDoc = Object.assign({}, product);
				var details = 'Activated product with _id, ' + req.params.id;
				var appName = req.decoded.appKey.name;
				var appKey = req.decoded.appKey.token;
				var member_id = req.decoded.admin
					? req.decoded.admin._id
					: req.decoded.superAdmin._id;
				var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
				log
					.create(
						'Update',
						details,
						'Product',
						oldDoc,
						newDoc,
						appName,
						appKey,
						member_id,
						memberType
					)
					.then(
						function (pLog) {
							product.updates.push({
								dateTime: dateTime.now(),
								member_id: member_id,
								memberType: memberType,
								log_id: pLog._id
							});
							product.save(function (err, product) {
								if (err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								}
								return res.status(200).send({
									state: 'success',
									message: 'Product activated successfully',
									product: product
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
		);
	});
}

module.exports = {
	create,
	getAll,
	get,
	update,
	deactivate,
	activate
};
