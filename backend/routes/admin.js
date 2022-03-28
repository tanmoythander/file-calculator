var express = require('express');
var router = express.Router();
var auth = require('./../components/auth');

// Router Models
var profileParamModel = require('./models/admin/profileParam');
var productParamModel = require('./models/admin/productParam');
var productModel = require('./models/admin/product');
var managementModel = require('./models/admin/management');
var bannerModel = require('./models/admin/banner');
var userModel = require('./models/admin/user');
var subscriptionModel = require('./models/admin/subscription');
var userProductModel = require('./models/admin/userProduct');
var logModel = require('./models/admin/log');
var systemModel = require('./models/admin/system');

// Register the authentication middlewares
// Auth App
router.use(auth.verifyAdminApp);
// Auth admin
router.use(auth.verifyAdmin);
// Auth hardware availability
/*
router.use('/softlayer/hardware/:id', hardwareAvailable);
router.use('/softlayer/hardware-user/:id', hardwareAvailable);
// Auth hardware power management
router.use('/softlayer/hardware/:id/power-on', powerFlag.hardware);
router.use('/softlayer/hardware/:id/power-off', powerFlag.hardware);
router.use('/softlayer/hardware/:id/reboot', powerFlag.hardware);
router.use('/softlayer/hardware/:id/reboot-soft', powerFlag.hardware);
router.use('/softlayer/hardware/:id/reboot-hard', powerFlag.hardware);
*/

/* eslint-disable max-len */
// Profile Parameter
router
	.route('/profile-param')
	/**
	 * @api {get} /admin/profile-param Get all Profile Parameters
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProfileParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/profile-param
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all profile parameters",
	 *     "profileParams": [Object]
	 *   }
	 */
	.get(profileParamModel.getAll)
	/**
	 * @api {post} /admin/profile-param Create a Profile Parameter
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProfileParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/profile-param
	 *
	 *   body:
	 *   {
	 *     "paramName": "NIBEDITA_TYPE",
	 *     "paramRequired": true,
	 *     "paramType": "string",
	 *     "paramEnums": ["NIBEDITA_ECO", "NIBEDITA_REGULAR"]
	 *   }
	 *
	 * @apiParam {String} paramName Name of parameter (required).
	 * @apiParam {Boolean} paramRequired If the parameter is mandatory or not (default: false).
	 * @apiParam {String} paramType Parameter value type ("string", "number", "boolean", "date" or "file") (default: "string").
	 * @apiParam {[String]} paramEnums Parameter enum values (use only if your paramType is, "string") (default: []).
	 * @apiParam {Number} paramMinLen Parameter minimum length (use with paramMaxLen only if your paramType is, "string") (default: 0).
	 * @apiParam {Number} paramMaxLen Parameter maximum length (use with paramMinLen only if your paramType is, "string") (default: 0).
	 * @apiParam {Number} paramMin Parameter minimum value (use with paramMax only if your paramType is, "number") (default: 0).
	 * @apiParam {Number} paramMax Parameter maximum value (use with paramMin only if your paramType is, "number") (default: 0).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Profile parameter created",
	 *     "profileParam": Object
	 *   }
	 */
	.post(profileParamModel.create);
router
	.route('/profile-param/:id')
	/**
	 * @api {get} /admin/profile-param/:id Get a Profile Parameter
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProfileParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/profile-param/d43refsref
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned profile parameter",
	 *     "profileParam": Object
	 *   }
	 */
	.get(profileParamModel.get);
router
	.route('/profile-param/:id/deactivate')
	/**
	 * @api {put} /admin/profile-param/:id/deactivate Deactivate a Profile Parameter
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProfileParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/profile-param/d43refsref/deactivate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Deactivated profile parameter",
	 *     "profileParam": Object
	 *   }
	 */
	.put(profileParamModel.deactivate);
router
	.route('/profile-param/:id/activate')
	/**
	 * @api {put} /admin/profile-param/:id/activate Activate a Profile Parameter
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProfileParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/profile-param/d43refsref/activate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Activated profile parameter",
	 *     "profileParam": Object
	 *   }
	 */
	.put(profileParamModel.activate);

// Product Parameter
router
	.route('/product-param')
	/**
	 * @api {get} /admin/product-param Get all Product Parameters
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProductParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product-param
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all product parameters",
	 *     "productParams": [Object]
	 *   }
	 */
	.get(productParamModel.getAll)
	/**
	 * @api {post} /admin/product-param Create a Product Parameter
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProductParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product-param
	 *
	 *   body:
	 *   {
	 *     "paramName": "Gender",
	 *     "paramType": "string",
	 *     "paramEnums": ["male", "female"]
	 *   }
	 *
	 * @apiParam {String} paramName Name of parameter (required).
	 * @apiParam {String} paramType Parameter value type ("string", "number", "boolean", "date" or "file") (default: "string").
	 * @apiParam {[String]} paramEnums Parameter enum values (use only if your paramType is, "string") (default: []).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Product parameter created",
	 *     "productParam": Object
	 *   }
	 */
	.post(productParamModel.create);
router
	.route('/product-param/:id')
	/**
	 * @api {get} /admin/product-param/:id Get a Product Parameter
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_ProductParameter
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product-param/67dfsgfds7ft
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success"
	 *     "message": "Returned product parameter",
	 *     "productParam": Object
	 *   }
	 */
	.get(productParamModel.get);

// Product
router
	.route('/product')
	/**
	 * @api {get} /admin/product Get all Products
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all products",
	 *     "products": [Object]
	 *   }
	 */
	.get(productModel.getAll)
	/**
	 * @api {post} /admin/product Create a Product
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product
	 *
	 *   body:
	 *   {
	 *     "name": "Zakat",
	 *     "productType": "OneTime",
	 *     "description": "",
	 *     "storeName": "Zakat",
	 *     "primaryBanner": "https://example.com/primary-image.jpg",
	 *     "secondaryBanner": "https://example.com/secondary-image.jpg",
	 *     "notifyIntervalDays": 365,
	 *     "amountIsFixed": false,
	 *     "productConfig": [
	 *       {
	 *         "paramName": "Vat_Rate",
	 *         "paramValue": "15"
	 *       },
	 *       {
	 *         "paramName": "SKU",
	 *         "paramMinLen": 5,
	 *         "paramMaxLen": 100,
	 *         "paramRequired": true
	 *       },
	 *       {
	 *         "paramName": "DELIVERY_CHARGE",
	 *         "paramMin": 10,
	 *         "paramMax": 10000000000,
	 *         "paramRequired": true
	 *       },
	 *       {
	 *         "paramName": "AGE",
	 *         "paramRequired": true
	 *       },
	 *       {
	 *         "paramName": "ADDRESS",
	 *         "paramRequired": true
	 *       }
	 *     ]
	 *   }
	 *
	 * @apiParam {String} name Name of product (required).
	 * @apiParam {String} productType Type of product (Anything unique under product name and store) (required).
	 * @apiParam {String} description Description of product (default: "").
	 * @apiParam {String} storeName Name of destination SSLCommerz store (required).
	 * @apiParam {String} primaryBanner Primary Banner image URL with ssl enabled (required).
	 * @apiParam {String} secondaryBanner Secondary Banner image URL with ssl enabled (default: NOT_SET).
	 * @apiParam {Number} notifyIntervalDays Number of days to wait after last payment to notify (default: 0).
	 * @apiParam {Boolean} amountIsFixed If the amount is fixed or not (default: false).
	 * @apiParam {[Object]} productConfig Array of product configuration objects (default: []).
	 * @apiParam {String} productConfig.paramName Name of product parameter (required).
	 * @apiParam {Number} productConfig.paramMinLen Parameter minimum length (use with paramMaxLen only if your paramType is, "string") (default: 0).
	 * @apiParam {Number} productConfig.paramMaxLen Parameter maximum length (use with paramMinLen only if your paramType is, "string") (default: 0).
	 * @apiParam {Number} productConfig.paramMin Parameter minimum value (use with paramMax only if your paramType is, "number") (default: 0).
	 * @apiParam {Number} productConfig.paramMax Parameter maximum value (use with paramMin only if your paramType is, "number") (default: 0).
	 * @apiParam {Boolean} productConfig.paramRequired If the product parameter is required or not (default: false).
	 * @apiParam {String} productConfig.paramValue Fixed value of the parameter (do not mention if there is no fixed value) (default: '').
	 * @apiParam {String} productConfig.paramSource Additional data field planned for paramType, "file" (do not mention if there is no fixed value) (default: "").
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Product created successfully",
	 *     "product": Object
	 *   }
	 */
	.post(productModel.create);
router
	.route('/product/:id')
	/**
	 * @api {get} /admin/product/:id Get a Product
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product/g86twd8egc
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned product",
	 *     "product": Object
	 *   }
	 */
	.get(productModel.get)
	/**
	 * @api {put} /admin/product/:id Update a Product
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product/g86twd8egc
	 *
	 *   body:
	 *   {
	 *     "description": "Here goes the description",
	 *     "primaryBanner": "https://example.com/primary-image.jpg",
	 *     "secondaryBanner": "https://example.com/secondary-image.jpg",
	 *     "notifyIntervalDays": 30,
	 *     "amountIsFixed": true,
	 *     "productConfig": [
	 *       {
	 *         "paramName": "Vat_Rate",
	 *         "paramValue": "15"
	 *       },
	 *       {
	 *         "paramName": "SKU",
	 *         "paramMinLen": 5,
	 *         "paramMaxLen": 100,
	 *         "paramRequired": true
	 *       },
	 *       {
	 *         "paramName": "DELIVERY_CHARGE",
	 *         "paramMin": 10,
	 *         "paramMax": 10000000000,
	 *         "paramRequired": true
	 *       },
	 *       {
	 *         "paramName": "AGE",
	 *         "paramRequired": true
	 *       },
	 *       {
	 *         "paramName": "ADDRESS",
	 *         "paramRequired": true
	 *       }
	 *   }
	 *
	 * @apiParam {String} description Description of product (default: UNCHANGED).
	 * @apiParam {String} primaryBanner Primary Banner image URL with ssl enabled (default: UNCHANGED).
	 * @apiParam {String} secondaryBanner Secondary Banner image URL with ssl enabled (default: UNCHANGED).
	 * @apiParam {String} notifyIntervalDays Number of days to wait after last payment to notify (default: UNCHANGED).
	 * @apiParam {Boolean} amountIsFixed If the amount is fixed or not (default: UNCHANGED).
	 * @apiParam {[Object]} productConfig Array of product configuration objects (default: UNCHANGED).
	 * @apiParam {String} productConfig.param_id Id of product parameter (required).
	 * @apiParam {Number} productConfig.paramMinLen Parameter minimum length (use with paramMaxLen only if your paramType is, "string") (default: 0).
	 * @apiParam {Number} productConfig.paramMaxLen Parameter maximum length (use with paramMinLen only if your paramType is, "string") (default: 0).
	 * @apiParam {Number} productConfig.paramMin Parameter minimum value (use with paramMax only if your paramType is, "number") (default: 0).
	 * @apiParam {Number} productConfig.paramMax Parameter maximum value (use with paramMin only if your paramType is, "number") (default: 0).
	 * @apiParam {Boolean} productConfig.paramRequired If the product parameter is required or not (default: false).
	 * @apiParam {Boolean} productConfig.paramValue Fixed value of the parameter (do not mention if there is no fixed value) (default: '').
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Product updated successfully",
	 *     "product": Object
	 *   }
	 */
	.put(productModel.update);
router
	.route('/product/:id/deactivate')
	/**
	 * @api {put} /admin/product/:id/deactivate Deactivate a Product
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product/g86twd8egc/deactivate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Product deactivated successfully",
	 *     "product": Object
	 *   }
	 */
	.put(productModel.deactivate);
router
	.route('/product/:id/activate')
	/**
	 * @api {put} /admin/product/:id/activate Activate a Product
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Product
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/product/g86twd8egc/activate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Product activated successfully",
	 *     "product": Object
	 *   }
	 */
	.put(productModel.activate);

///////////////////// Management APIs /////////////////////

// Role
router
	.route('/role')
	/**
	 * @api {get} /admin/role Get All Roles
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/role
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all available roles",
	 *     "roles": [Object]
	 *   }
	 */
	.get(managementModel.role.getAll);

// Admin
router
	.route('/admin')
	/**
	 * @api {get} /admin/admin Get All Admins
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/admin
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all admins",
	 *     "admins": [Object]
	 *   }
	 */
	.get(managementModel.admin.getAll)
	/**
	 * @api {post} /admin/admin Create Admin
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/admin
	 *
	 *   body:
	 *   {
	 *     "name": "John Doe",
	 *     "email": "test@test.org",
	 *     "department": "Accounting",
	 *     "designation": "Senior Cashier",
	 *     "roles": [
	 *       {
	 *          "collectionName": "User",
	 *          "access": "r"
	 *       },
	 *       {
	 *          "collectionName": "UserProduct",
	 *          "access": "rw"
	 *       },
	 *       {
	 *          "collectionName": "ProfileParam",
	 *          "access": "r"
	 *       }
	 *     ]
	 *   }
	 *
	 * @apiParam {String} name Full name (required).
	 * @apiParam {String} email Email address (required).
	 * @apiParam {String} department Department name (required).
	 * @apiParam {String} designation Admin designation (required).
	 * @apiParam {[Object]} roles Array of role objects (required).
	 * @apiParam {String} roles.collectionName Name of database collection (required).
	 * @apiParam {String} roles.access Access type (read => "r", read-write => "rw") (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Verification email sent"
	 *   }
	 */
	.post(managementModel.admin.create)
	/**
	 * @api {put} /admin/admin Search Admin with Pagination
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/admin
	 *
	 *   body:
	 *   {
	 *     "query": "John Doe",
	 *     "oldestFirst": false,
	 *     "pagination": {
	 *       "itemsPerPage": 50,
	 *       "pageIndex": 2
	 *     }
	 *   }
	 *
	 * @apiParam {String} query Search query string (default: undefined).
	 * @apiParam {Boolean} oldestFirst Sort results from oldest to newest or not (default: false).
	 * @apiParam {Object} pagination Pagination config object (default: undefined).
	 * @apiParam {Number} pagination.itemsPerPage Number of items per page (min: 5, max: 500) (default: 20).
	 * @apiParam {Number} pagination.pageIndex Page index you want to view (min: 1) (default: 1).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned admins",
	 *     "pagination": {
	 *       "totalItems": 322,
	 *       "itemsPerPage": 50,
	 *       "totalPages": 7,
	 *       "pageIndex": 2
	 *     },
	 *     "admins": [Object]
	 *   }
	 */
	.put(managementModel.admin.search);

router
	.route('/admin/:id')
	/**
	 * @api {get} /admin/admin/:id Get an Admin
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/admin/975f3hfhrg
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned admin",
	 *     "admin": Object
	 *   }
	 */
	.get(managementModel.admin.get)
	/**
	 * @api {put} /admin/admin/:id Update an Admin
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/admin/975f3hfhrg
	 *
	 *   body:
	 *   {
	 *     "name": "John Doe",
	 *     "department": "Accounting",
	 *     "designation": "Senior Cashier",
	 *     "roles": [
	 *       {
	 *          "collectionName": "User",
	 *          "access": "r"
	 *       },
	 *       {
	 *          "collectionName": "UserProduct",
	 *          "access": "rw"
	 *       },
	 *       {
	 *          "collectionName": "ProfileParam",
	 *          "access": "r"
	 *       }
	 *     ]
	 *   }
	 *
	 * @apiParam {String} name Full name (default: UNCHANGED).
	 * @apiParam {String} department Department name (default: UNCHANGED).
	 * @apiParam {String} designation Admin designation (default: UNCHANGED).
	 * @apiParam {[Object]} roles Array of role objects (default: UNCHANGED).
	 * @apiParam {String} roles.collectionName Name of database collection (required).
	 * @apiParam {String} roles.access Access type (read => "r", read-write => "rw") (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Admin updated successfully",
	 *     "admin": Object
	 *   }
	 */
	.put(managementModel.admin.update);

router
	.route('/admin/:id/deactivate')
	/**
	 * @api {put} /admin/admin/:id/deactivate Deactivate an Admin
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/admin/975f3hfhrg/deactivate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Admin deactivated successfully",
	 *     "admin": Object
	 *   }
	 */
	.put(managementModel.admin.deactivate);

router
	.route('/admin/:id/activate')
	/**
	 * @api {put} /admin/admin/:id/activate Activate an Admin
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Management
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/admin/975f3hfhrg/activate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Admin activated successfully",
	 *     "admin": Object
	 *   }
	 */
	.put(managementModel.admin.activate);

// Banner
router
	.route('/banner')
	/**
	 * @api {get} /admin/banner Get All Banners
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Banner
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/banner
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all banners",
	 *     "banners": [Object]
	 *   }
	 */
	.get(bannerModel.getAll)
	/**
	 * @api {post} /admin/banner Create a Banner
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Banner
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/banner
	 *
	 *   body:
	 *   {
	 *     "header": "Header is shown on list only",
	 *     "title": "Title is shown on list and detail screen",
	 *     "description": "Description is shown on detail screen only",
	 *     "imageURL": "https://example.com/image.jpg",
	 *     "bannerType": "Promotion",
	 *     "expiresAt": 1537631917362687
	 *   }
	 *
	 * @apiParam {String} header Banner header (required).
	 * @apiParam {String} title Banner title (required).
	 * @apiParam {String} description Banner description (required).
	 * @apiParam {String} imageURL Banner image URL with ssl enabled (required).
	 * @apiParam {String} bannerType "Promotion" or "News" (default: News).
	 * @apiParam {Number} expiresAt Date of expiry in millis (default: 365 days from creation).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Banner created successfully",
	 *     "banner": Object
	 *   }
	 */
	.post(bannerModel.create);

router
	.route('/banner/:id')
	/**
	 * @api {get} /admin/banner/:id Get a Banner
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Banner
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/banner/786gt86g76th
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned banner",
	 *     "banner": Object
	 *   }
	 */
	.get(bannerModel.get)
	/**
	 * @api {put} /admin/banner Update a Banner
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Banner
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/banner/786gt86g76th
	 *
	 *   body:
	 *   {
	 *     "header": "Header is shown on list only",
	 *     "title": "Title is shown on list and detail screen",
	 *     "description": "Description is shown on detail screen only",
	 *     "imageURL": "https://example.com/new-image.jpg",
	 *     "bannerType": "Promotion",
	 *     "expiresAt": 1537631917362687
	 *   }
	 *
	 * @apiParam {String} header Banner header (default: [Unchanged]).
	 * @apiParam {String} title Banner title (default: [Unchanged]).
	 * @apiParam {String} description Banner description (default: [Unchanged]).
	 * @apiParam {String} imageURL Banner image URL with ssl enabled (default: [Unchanged]).
	 * @apiParam {String} bannerType "Promotion" or "News" (default: [Unchanged]).
	 * @apiParam {Number} expiresAt Date of expiry in millis (default: [Unchanged]).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Banner updated successfully",
	 *     "banner": Object
	 *   }
	 */
	.put(bannerModel.update);

router
	.route('/banner/:id/deactivate')
	/**
	 * @api {post} /admin/banner/:id/deactivate Deactivate a Banner
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Banner
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/banner/786gt86g76th/deactivate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Banner deactivated successfully",
	 *     "banner": Object
	 *   }
	 */
	.post(bannerModel.deactivate);

router
	.route('/banner/:id/activate')
	/**
	 * @api {post} /admin/banner/:id/activate Activate a Banner
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Banner
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/banner/786gt86g76th/activate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Banner activated successfully",
	 *     "banner": Object
	 *   }
	 */
	.post(bannerModel.activate);

// User
router
	.route('/user')
	/**
	 * @api {get} /admin/user Get All Users
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_User
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all users",
	 *     "users": [Object]
	 *   }
	 */
	.get(userModel.getAll)
	/**
	 * @api {post} /admin/user Search User with Pagination
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_User
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user
	 *
	 *   body:
	 *   {
	 *     "query": "John Doe",
	 *     "oldestFirst": false,
	 *     "pagination": {
	 *       "itemsPerPage": 50,
	 *       "pageIndex": 2
	 *     }
	 *   }
	 *
	 * @apiParam {String} query Search query string (default: undefined).
	 * @apiParam {Boolean} oldestFirst Sort results from oldest to newest or not (default: false).
	 * @apiParam {Object} pagination Pagination config object (default: undefined).
	 * @apiParam {Number} pagination.itemsPerPage Number of items per page (min: 5, max: 500) (default: 20).
	 * @apiParam {Number} pagination.pageIndex Page index you want to view (min: 1) (default: 1).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned users",
	 *     "pagination": {
	 *       "totalItems": 322,
	 *       "itemsPerPage": 50,
	 *       "totalPages": 7,
	 *       "pageIndex": 2
	 *     },
	 *     "users": [Object]
	 *   }
	 */
	.post(userModel.search);

router
	.route('/user/:id')
	/**
	 * @api {get} /admin/user/:id Get a User
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_User
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user/975f3hfhrg
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned user",
	 *     "user": Object
	 *   }
	 */
	.get(userModel.get);

router
	.route('/user/:id/deactivate')
	/**
	 * @api {put} /admin/user/:id/deactivate Deactivate a User
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_User
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user/975f3hfhrg/deactivate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User deactivated successfully",
	 *     "user": Object
	 *   }
	 */
	.put(userModel.deactivate);

router
	.route('/user/:id/activate')
	/**
	 * @api {put} /admin/user/:id/activate Activate a User
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_User
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user/975f3hfhrg/activate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User activated successfully",
	 *     "user": Object
	 *   }
	 */
	.put(userModel.activate);

// User
router
	.route('/subscription')
	/**
	 * @api {get} /admin/subscription Get All Subscriptions
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Subscription
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/subscription
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all subscriptions",
	 *     "subscriptions": [Object]
	 *   }
	 */
	.get(subscriptionModel.getAll);

// UserProduct
router
	.route('/user-product')
	/**
	 * @api {get} /admin/user-product Get All UserProducts
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user-product
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all userProducts",
	 *     "userProducts": [Object]
	 *   }
	 */
	.get(userProductModel.getAll);
/**
 * @api {post} /admin/user-product Search UserProduct with Pagination
 * @apiVersion 1.0.0
 * @apiGroup Admin_UserProduct
 * @apiHeader {String} Content-Type application/json
 * @apiHeader {String} app-key App specific access key
 * @apiHeader {String} admin-key Admin access key
 * @apiExample Example Usage:
 *   url: http://localhost:6259/admin/user-product
 *
 *   body:
 *   {
 *     "filterType": "ENDS",
 *     "userProductType": "ALL",
 *     "startDate": 1603739279694,
 *     "endDate": 1640973600000,
 *     "newestFirst": false,
 *     "pagination": {
 *       "itemsPerPage": 50,
 *       "pageIndex": 2
 *     }
 *   }
 *
 * @apiParam {String} filterType Type of filter ('NONE', 'PENDING', 'STARTS', 'ENDS' or 'SEARCH') (default: 'NONE').
 * @apiParam {String} userProductType Type of userProduct ('ALL', 'NIB', 'PPA', 'MTR' or 'B&H') (default: 'ALL') (Only applicable to filterTypes, 'PENDING', 'STARTS', 'ENDS' or 'NONE').
 * @apiParam {Number} startDate Filter start date (in millis) (default: undefined) (Only applicable to filterTypes, 'PENDING', 'STARTS' or 'ENDS').
 * @apiParam {Number} endDate Filter end date (in millis) (default: undefined) (Only applicable to filterTypes, 'PENDING', 'STARTS' or 'ENDS').
 * @apiParam {String} searchQuery DocID, mobileNo or email (default: undefined) (Only applicable to filterType, 'SEARCH').
 * @apiParam {Boolean} newestFirst Sort results from newest to oldest or not (default: false).
 * @apiParam {Object} pagination Pagination config object (default: undefined).
 * @apiParam {Number} pagination.itemsPerPage Number of items per page (min: 5, max: 500) (default: 20).
 * @apiParam {Number} pagination.pageIndex Page index you want to view (min: 1) (default: 1).
 * @apiSuccessExample {json} Success Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "state": "success",
 *     "message": "Returned userProducts",
 *     "pagination": {
 *       "totalItems": 322,
 *       "itemsPerPage": 50,
 *       "totalPages": 7,
 *       "pageIndex": 2
 *     },
 *     "userProducts": [Object]
 *   }
 */
// .post(userProductModel.search);

router
	.route('/user-product/:id')
	/**
	 * @api {get} /admin/user-product/:id Get an UserProduct
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user-product/975f3hfhrg
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned userProduct",
	 *     "userProduct": Object
	 *   }
	 */
	.get(userProductModel.get);

router
	.route('/user-product/:id/deactivate')
	/**
	 * @api {put} /admin/user-product/:id/deactivate Deactivate an UserProduct
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user-product/975f3hfhrg/deactivate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "UserProduct deactivated successfully",
	 *     "userProduct": Object
	 *   }
	 */
	.put(userProductModel.deactivate);

router
	.route('/user-product/:id/activate')
	/**
	 * @api {put} /admin/user-product/:id/activate Activate an UserProduct
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/user-product/975f3hfhrg/activate
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "UserProduct activated successfully",
	 *     "userProduct": Object
	 *   }
	 */
	.put(userProductModel.activate);

// Log
router
	.route('/log')
	/**
	 * @api {get} /admin/log Get Latest Logs
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Log
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/log
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned latest logs",
	 *     "logs": [Object]
	 *   }
	 */
	.get(logModel.getLatest);
router
	.route('/log/:lines')
	/**
	 * @api {get} /admin/log/:lines Get Logs by Lines
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Log
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/log/250
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned last 250 lines of logs",
	 *     "logs": [Object]
	 *   }
	 */
	.get(logModel.getLines);

// System
router
	.route('/system/maintenance')
	/**
	 * @api {get} /admin/system/maintenance Get Maintenance Status
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_System
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/system/maintenance
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned maintenance status",
	 *     "maintenance": true
	 *   }
	 */
	.get(systemModel.getMaintenanceStatus)
	/**
	 * @api {put} /admin/system/maintenance Set Maintenance Status
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_System
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} admin-key Admin access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/admin/system/maintenance
	 *
	 *   body:
	 *   {
	 *     "status": false
	 *   }
	 *
	 * @apiParam {Boolean} status Maintenance status.
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Set maintenance status",
	 *     "maintenance": false
	 *   }
	 */
	.put(systemModel.setMaintenanceStatus);

/* eslint-enable max-len */

module.exports = router;
