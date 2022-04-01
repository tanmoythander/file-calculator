var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var log = require('./../../../components/log');
var parse = require('./../../../components/parse');

// Models
var UserProduct = mongoose.model('UserProduct');
var Payment = mongoose.model('Payment');

function getAll(req, res) {
	var query = UserProduct.find(
		{
			user_id: req.decoded.user._id
		},
		function (err, userProducts) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			// create log
			var details = `Read all available own (${userProducts.length}) userProducts`;
			var appName = req.decoded.appKey.name;
			var appKey = req.decoded.appKey.token;
			var member_id = req.decoded.user._id;
			var memberType = 'User';
			log
				.create(
					'read',
					details,
					'UserProduct',
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
				message: 'Returned all userProducts',
				userProducts: userProducts.map(item => parse.userProduct(item))
			});
		}
	);
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function getData(req, res) {
	// Defaults
	var itemsPerPage =
		req.body.pagination &&
		req.body.pagination.itemsPerPage &&
		!isNaN(parseInt(req.body.pagination.itemsPerPage))
			? parseInt(req.body.pagination.itemsPerPage)
			: 50;
	var pageIndex =
		req.body.pagination &&
		req.body.pagination.pageIndex &&
		!isNaN(parseInt(req.body.pagination.pageIndex))
			? parseInt(req.body.pagination.pageIndex)
			: 1;

	// Corrections
	if (itemsPerPage < 5) {
		itemsPerPage = 5;
	} else if (itemsPerPage > 500) {
		itemsPerPage = 500;
	}
	if (pageIndex < 1) {
		pageIndex = 1;
	}

	var query = UserProduct.find(
		{
			user_id: req.decoded.user._id
		},
		function (err, userProducts) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}

			// parse policies
			var parsedUserProducts = userProducts.map(item =>
				parse.userProduct(item)
			);

			// process pagination
			var totalItems = parsedUserProducts.length;
			var totalPages = Math.ceil(totalItems / itemsPerPage);
			if (pageIndex > totalPages) {
				pageIndex = totalPages;
			}
			var cursorIndex = (pageIndex - 1) * itemsPerPage;
			var currentItems = parsedUserProducts.slice(
				cursorIndex,
				cursorIndex + itemsPerPage
			);

			// create log
			var details = `Read ${cursorIndex + 1}-${
				cursorIndex + currentItems.length
			} of ${totalItems} userProducts`;
			var appName = req.decoded.appKey.name;
			var appKey = req.decoded.appKey.token;
			var member_id = req.decoded.user._id;
			var memberType = 'User';
			log
				.create(
					'read',
					details,
					'UserProduct',
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
				message: 'backend.user.userProduct.returned.userProducts',
				pagination: {
					totalItems: totalItems,
					itemsPerPage: itemsPerPage,
					totalPages: totalPages,
					pageIndex: pageIndex
				},
				userProducts: currentItems
			});
		}
	);
	query.sort(
		req.body.oldestFirst && req.body.oldestFirst === true
			? 'created.dateTime'
			: '-created.dateTime'
	);
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function getAllPayments(req, res) {
	var userProductQuery = UserProduct.find(
		{
			user_id: req.decoded.user._id
		},
		function (err, userProducts) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			var query = Payment.find(
				{
					user_id: req.decoded.user._id,
					userProduct_id: {
						$in: userProducts.map(item => item._id.toString())
					}
				},
				function (err, payments) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					// create log
					var details = `Read all available own (${payments.length}) payments`;
					var appName = req.decoded.appKey.name;
					var appKey = req.decoded.appKey.token;
					var member_id = req.decoded.user._id;
					var memberType = 'User';
					log
						.create(
							'read',
							details,
							'Payment',
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
						message: 'Returned all payments',
						payments: payments
					});
				}
			);
			query.sort('-tran_date');
			query.select(
				'userProduct_id amount receiptNo tran_date card_brand card_type ' +
					'card_no bank_tran_id card_issuer card_issuer_country active'
			);
			assert.ok(query.exec() instanceof require('q').makePromise);
		}
	);
	assert.ok(userProductQuery.exec() instanceof require('q').makePromise);
}

module.exports = {
	getAll,
	getData,
	getAllPayments
};
