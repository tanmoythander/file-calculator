/* eslint-disable max-len */
var express = require('express');
var router = express.Router();
var system = require('./../components/system');

// Router Models
var productModel = require('./models/public/product');
var userProductModel = require('./models/public/userProduct');
var supportModel = require('./models/public/support');
var bannerModel = require('./models/public/banner');

// maintenance checking middleware
router.use(system.checkMaintenance);

// Product
router
	.route('/product')
	/**
	 * @api {get} /public/product Get All Active Products
	 * @apiVersion 1.0.0
	 * @apiGroup Public_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/public/product
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all active products",
	 *     "products": [Object]
	 *   }
	 */
	.get(productModel.getAll);

router
	.route('/product/:id')
	/**
	 * @api {post} /public/product/:id Get Product Subscribed Amount
	 * @apiVersion 1.0.0
	 * @apiGroup Public_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/public/product/g86twd8egc
	 *
	 *   body:
	 *   {
	 *     "phoneOrEmail": 'example@test.com'
	 *   }
	 *
	 * @apiParam {String} phoneOrEmail Phone number or email address of the user.
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Product subscription amount returned",
	 *     "amount": 500
	 *   }
	 */
	.post(productModel.amount);

// UserProduct
router
	.route('/user-product')
	/**
	 * @api {post} /public/user-product Initialise UserProduct Purchase
	 * @apiVersion 1.0.0
	 * @apiGroup Public_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/public/user-product
	 *
	 *   body:
	 *   {
	 *     "product_id": "87iew6f8w7ebtf",
	 *     "amount": 500,
	 *     "phoneOrEmail": 'example@test.com',
	 *     "name": 500,
	 *     "productParams": [
	 *       {
	 *         "paramName": "stampCharge",
	 *         "paramValue": "5"
	 *       },
	 *       {
	 *         "paramName": "vat",
	 *         "paramValue": "75"
	 *       },
	 *       {
	 *         "paramName": "totalAmount",
	 *         "paramValue": "580"
	 *       }
	 *     ]
	 *   }
	 *
	 * @apiParam {String} product_id id of product (required).
	 * @apiParam {Number} amount Amount of money (in BDT) (required).
	 * @apiParam {String} phoneOrEmail Phone number or email address of the user.
	 * @apiParam {String} name Name of the user.
	 * @apiParam {[Object]} productParams Array of product parameter objects (default: []).
	 * @apiParam {String} productParams.paramName Name of product parameter (required).
	 * @apiParam {String} productParams.paramValue Value of product parameter (required).
	 * @apiParam {String} productParams.paramSource Additional data field planned for paramType, "file" (default: "").
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "UserProduct purchase initialised successfully",
	 *     "userProduct": Object,
	 *     "paymentGatewayURL": "https://sandbox.sslcommerz.com/EasyCheckOut/testcde02e77cd96df8fd9935de69c3244"
	 *   }
	 */
	.post(userProductModel.create);

router
	.route('/user-product/:id')
	/**
	 * @api {get} /public/user-product/:id Get a UserProduct
	 * @apiVersion 1.0.0
	 * @apiGroup Public_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/public/user-product/g86twd8egc
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned UserProduct",
	 *     "userProduct": Object
	 *   }
	 */
	.get(userProductModel.get);

router
	.route('/user-product/:id/payment')
	/**
	 * @api {get} /public/user-product/:id/payment Get UserProduct payment info
	 * @apiVersion 1.0.0
	 * @apiGroup Public_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/public/user-product/g86twd8egc/payment
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "UserProduct payment info returned",
	 *     "userProduct": Object,
	 *     "paymentGatewayURL": "https://sandbox.sslcommerz.com/EasyCheckOut/testcde02e77cd96df8fd9935de69c3244"
	 *   }
	 */
	.get(userProductModel.pay);

///////////////////////////
// Support API
// /public/contact
///////////////////////////

router
	.route('/contact')
	/**
	 * @api {post} /public/contact Contact Support
	 * @apiVersion 1.0.0
	 * @apiGroup Public_Support
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/public/contact
	 *
	 *   body:
	 *   {
	 *     "name": "John Doe",
	 *     "replyEmail": "replyme@example.com",
	 *     "destinationEmail": "destination@example.com",
	 *     "topic": "Others",
	 *     "message": "How to get quote?"
	 *   }
	 *
	 * @apiParam {String} name Name of the user (required).
	 * @apiParam {String} replyEmail Email address to contact the user (required).
	 * @apiParam {String} destinationEmail Email address of support center (required).
	 * @apiParam {String} topic Support topic (required).
	 * @apiParam {String} message Message from the user (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Your message has been received. We will contact you shortly."
	 *   }
	 */
	.post(supportModel.contact);

///////////////////////////
// Banner API
// /public/banner
///////////////////////////

router
	.route('/banner')
	/**
	 * @api {get} /public/banner Get Available Banners
	 * @apiVersion 1.0.0
	 * @apiGroup Public_Banner
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/public/banner
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned available banners",
	 *     "banners": [Object]
	 *   }
	 */
	.get(bannerModel.getAll);

module.exports = router;
