var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var validate = require('./../../../components/validate');

// Models
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var Subscription = mongoose.model('Subscription');

function getAll(req, res) {
	var query = Product.find({ active: true }, function (err, products) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		return res.status(200).send({
			state: 'success',
			message: 'Returned all active products',
			products: products
		});
	});
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function amount(req, res) {
	// API Validation
	if (!req.body.phoneOrEmail || req.body.phoneOrEmail === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Mobile number or email address is required'
		});
	}
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
	User.findOne(
		{
			id: req.body.phoneOrEmail
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
					state: 'success',
					message: 'No purchase history found'
				});
			}
			Subscription.findOne(
				{
					product_id: req.params.id,
					user_id: user._id,
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
						return res.status(200).send({
							state: 'success',
							message: 'No previous subscription found'
						});
					}
					return res.status(200).send({
						state: 'success',
						message: 'Product subscription amount returned',
						amount: subscription.amount
					});
				}
			);
		}
	);
}

module.exports = {
	getAll,
	amount
};
