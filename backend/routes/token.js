var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var auth = require('./../components/auth');
var system = require('./../components/system');

// Router Models
var userTokenModel = require('./models/token/user');
var adminTokenModel = require('./models/token/admin');

/* eslint-enable no-unused-vars */

// Register the authentication middlewares
// Auth User
router.use('/user', auth.verifyUserApp);
router.use('/user', system.checkMaintenance);
router.use('/admin', auth.verifyAdminApp);

/******************** User Authentication *******************/
// NOTE: User can't reset password using email
router
	.route('/user/login')
	/**
	 * @api {post} /token/user/login Login
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/login
	 *
	 *   body:
	 *   {
	 *     "username": "johndoe@gmail.com",
	 *     "password": "yourPassw0rd",
	 *     "notificationToken": "78by79bty79_7ydhs87cvds:ihumdsuy"
	 *   }
	 *
	 * @apiParam {String} username User mobile or email (required).
	 * @apiParam {String} password User password (required).
	 * @apiParam {String} notificationToken Device's notification token (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully logged in",
	 *     "token": "xxxxxxxxxxxx",
	 *     "user": Object
	 *   }
	 */
	.post(userTokenModel.login);
router
	.route('/user/check/mobile')
	/**
	 * @api {post} /token/user/check/mobile Check Mobile Registration Status
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/check/mobile
	 *
	 *   body:
	 *   {
	 *     "mobileNo": "01456456456"
	 *   }
	 *
	 * @apiParam {String} mobileNo Mobile number to be checked (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Mobile number is registered",
	 *     "registered": true,
	 *     "verified": true
	 *   }
	 */
	.post(userTokenModel.checkMobile);
router
	.route('/user/check/email')
	/**
	 * @api {post} /token/user/check/email Check Email Registration Status
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/check/email
	 *
	 *   body:
	 *   {
	 *     "email": "test@test.org"
	 *   }
	 *
	 * @apiParam {String} email Email address to be checked (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Email address is registered",
	 *     "registered": true,
	 *     "verified": true
	 *   }
	 */
	.post(userTokenModel.checkEmail);
router
	.route('/user/otp')
	/**
	 * @api {post} /token/user/otp Send OTP
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/otp
	 *
	 *   body:
	 *   {
	 *     "mobileNo": "+8801456456456"
	 *   }
	 *
	 * @apiParam {String} mobileNo Mobile number to verify (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "OTP sent"
	 *   }
	 */
	.post(userTokenModel.sendMobileOTP);
router
	.route('/user/otp/check')
	/**
	 * @api {post} /token/user/otp/check Check OTP
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/otp/check
	 *
	 *   body:
	 *   {
	 *     "mobileNo": "01876XXX667",
	 *     "otp": "675XXX"
	 *   }
	 *
	 * @apiParam {String} mobileNo User mobile no (required).
	 * @apiParam {String} otp Valid 6-digit otp (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "OTP checked",
	 *     "usability": true
	 *   }
	 */
	.post(userTokenModel.verifyMobileOTP);
/* eslint-disable */
router
	.route('/user/signup')
	/**
	 * @api {post} /token/user/signup Signup
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/signup
	 *
	 *   body:
	 *   {
	 *     "fullname": "John Doe",
	 *     "nickname": "John",
	 *     "relationshipStatus": "test@test.org",
	 *     "gender": "Male",
	 *     "religion": "Christianity",
	 *     "bloodGroup": "O+",
	 *     "dob": 15214523652145,
	 *     "height": 66,
	 *     "weight": 65,
	 *     "district": "Dhaka",
	 *     "nationality": "Bangladeshi",
	 *     "mobileNo": "01876XXX667",
	 *     "email": "test@test.org",
	 *     "password": "testPassw0rd",
	 *     "otp": "675XXX",
	 *     "notificationToken": "78by79bty79_7ydhs87cvds:ihumdsuy"
	 *   }
	 *
	 * @apiParam {String} fullname Full name of the user (required) (Minimum 5 and maximum 100 characters).
	 * @apiParam {String} nickname Display name of the user (required) (Minimum 3 and maximum 15 characters and allows only A-Z and a-z).
	 * @apiParam {String} relationshipStatus Relationship status of the user (required) ('Single', 'Divorced' or 'Widowed').
	 * @apiParam {String} gender Gender of the user (required) ('Male' or 'Female').
	 * @apiParam {String} religion Religion of the user (required) ('Islam', 'Hinduism', 'Christianity' or 'Buddhism').
	 * @apiParam {String} bloodGroup Blood group of the user (required) ('A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-' or 'O-').
	 * @apiParam {Number} dob Date of birth of the user (required) (in millis).
	 * @apiParam {Number} height Height of the user (required) (Minimum 36 and maximum 96 inches).
	 * @apiParam {Number} weight Weight of the user (required) (Minimum 30 and maximum 150 KG).
	 * @apiParam {String} district District name of the user (required).
	 * @apiParam {String} nationality Nationality of the user (required) ('Bangladeshi' or 'Other').
	 * @apiParam {String} mobileNo User mobile no (required).
	 * @apiParam {String} email User email address (default: 'UNDEFINED').
	 * @apiParam {String} password User password (required) (Minimum 8 and maximum 50 characters, at least one uppercase letter, one lowercase letter and one number).
	 * @apiParam {String} otp Valid 6-digit otp (required).
	 * @apiParam {String} notificationToken Device's notification token (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully signed up",
	 *     "token": "xxxxxxxxxxxx",
	 *     "user": Object
	 *   }
	 */
	/* eslint-enable */
	.post(userTokenModel.signupByMobileOTP);
/* eslint-disable */
router
	.route('/user/reset')
	/**
	 * @api {post} /token/user/reset Reset Password
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/reset
	 *
	 *   body:
	 *   {
	 *     "mobileNo": "01458785XXX",
	 *     "password": "HereGoesThePassw0rd:):)",
	 *     "otp": "876XXX",
	 *     "notificationToken": "78by79bty79_7ydhs87cvds:ihumdsuy"
	 *   }
	 *
	 * @apiParam {String} mobileNo User mobile no (required).
	 * @apiParam {String} password New password (required) (Minimum 8 and maximum 50 characters, at least one uppercase letter, one lowercase letter and one number).
	 * @apiParam {String} otp Valid 6-digit otp (required).
	 * @apiParam {String} notificationToken Device's notification token (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully reset password",
	 *     "token": "xxxxxxxxxxxx",
	 *     "user": Object
	 *   }
	 */
	/* eslint-disable */
	.post(userTokenModel.resetByMobileOTP);

// Exceptional API
// Belongs to user, but uses admin app-key
router
	.route('/admin/user/verify')
	/**
	 * @api {post} /token/user/verify Verify Email Link (Exception)
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key (EXCEPTION ALERT: Bound to Admin app-key)
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/user/verify
	 *
	 *   body:
	 *   {
	 *     "token": "i76i6g85876h7h687"
	 *   }
	 *
	 * @apiParam {String} token Token of the link (https://test.com/a/b/c/TOKEN) (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Email verified"
	 *   }
	 */
	.post(userTokenModel.verifyEmailByOTP);
/************************************************************/

/******************* Admin Authentication *******************/
// NOTE: Admin can use email as username only, no mobile
router
	.route('/admin/login')
	/**
	 * @api {post} /token/admin/login Login
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/admin/login
	 *
	 *   body:
	 *   {
	 *     "username": "johndoe",
	 *     "password": "y0urPassw0rd"
	 *   }
	 *
	 * @apiParam {String} username Admin username or email (required).
	 * @apiParam {String} password Admin password (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully logged in",
	 *     "token": "xxxxxxxxxxxx",
	 *     "admin": Object
	 *   }
	 */
	.post(adminTokenModel.login);
router
	.route('/admin/link')
	/**
	 * @api {post} /token/admin/link Send Email Verification Link
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/admin/link
	 *
	 *   body:
	 *   {
	 *     "email": "test@example.com"
	 *   }
	 *
	 * @apiParam {String} email Email address to verify (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Verification email sent"
	 *   }
	 */
	.post(adminTokenModel.sendOTP);
router
	.route('/admin/verify')
	/**
	 * @api {post} /token/admin/verify Verify Email Link data
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/admin/verify
	 *
	 *   body:
	 *   {
	 *     "token": "i76i6g85876h7h687"
	 *   }
	 *
	 * @apiParam {String} token Token of the link (https://test.com/a/b/c/TOKEN) (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Link validated"
	 *   }
	 */
	.post(adminTokenModel.verifyOTP);
router
	.route('/admin/reset')
	/**
	 * @api {post} /token/admin/reset Reset Password
	 * @apiVersion 1.0.0
	 * @apiGroup Admin_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/token/admin/reset
	 *
	 *   body:
	 *   {
	 *     "token": "i76i6g85876h7h687",
	 *     "password": "n3wPassword"
	 *   }
	 *
	 * @apiParam {String} token Token of the link (https://test.com/a/b/c/TOKEN) (required).
	 * @apiParam {String} password New admin password (required) (Minimum 8 and maximum 50 characters, at least one uppercase letter, one lowercase letter and one number).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully reset password",
	 *     "token": "xxxxxxxxx",
	 *     "admin": Object
	 *   }
	 */
	.post(adminTokenModel.resetByOTP);
/************************************************************/

module.exports = router;
