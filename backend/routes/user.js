var express = require('express');
var router = express.Router();
var auth = require('./../components/auth');
var system = require('./../components/system');
var storage = require('./../components/storage');

// router models
var tokenModel = require('./models/user/token');
var profileModel = require('./models/user/profile');
var userProductModel = require('./models/user/userProduct');
var matchModel = require('./models/user/match');
var conversationModel = require('./models/user/conversation');
var activityModel = require('./models/user/activity');
var supportModel = require('./models/user/support');

// Register the authentication middlewares
// Auth App
router.use(auth.verifyUserApp);
// Auth user
router.use(auth.verifyUser);
// System maintenance status
router.use(system.checkMaintenance);

/* eslint-disable max-len */
///////////////////////////
// Token API
// /user/reset
// /user/logout
///////////////////////////

router
	.route('/reset')
	/**
	 * @api {get} /user/reset Reset Access Token
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/reset
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Token reset successful",
	 *     "token": "xxxxxxxxxxxx",
	 *     "user": Object
	 *   }
	 */
	.get(tokenModel.reset);

router
	.route('/logout')
	/**
	 * @api {get} /user/logout Logout
	 * @apiVersion 1.0.0
	 * @apiGroup User_Authentication
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/logout
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully logged out",
	 *     "user": Object
	 *   }
	 */
	.get(tokenModel.logout);

///////////////////////////
// Profile API
// /user/profile
///////////////////////////

// API for
// getting profile
// updating profile
// and more

router
	.route('/profile')
	/**
	 * @api {get} /user/profile Get User Profile
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User profile returned",
	 *     "profile": Object
	 *   }
	 */
	.get(profileModel.get)
	/**
	 * @api {put} /user/profile Set User Profile
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile
	 *
	 *   body:
	 *   {
	 *     "nickname": "John",
	 *     "about": "This is all about myself.",
	 *     "relationshipStatus": "Single",
	 *     "height": 66,
	 *     "weight": 65,
	 *     "district": "Dhaka",
	 *     "nationality": "Bangladeshi"
	 *   }
	 *
	 * @apiParam {String} nickname Display name of the user (default: UNCHANGED) (Minimum 3 and maximum 15 characters).
	 * @apiParam {String} about About the user (default: UNCHANGED) (Minimum 25 and maximum 3000 characters).
	 * @apiParam {String} relationshipStatus Relationship status of the user (default: UNCHANGED) ('Single', 'Divorced' or 'Widowed').
	 * @apiParam {Number} height Height of the user (default: UNCHANGED) (Minimum 36 and maximum 96 inches).
	 * @apiParam {Number} weight Weight of the user (default: UNCHANGED) (Minimum 30 and maximum 150 KG).
	 * @apiParam {String} district District name of the user (default: UNCHANGED).
	 * @apiParam {String} nationality Nationality of the user (default: UNCHANGED) ('Bangladeshi' or 'Other').
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User profile updated",
	 *     "profile": Object
	 *   }
	 */
	.put(profileModel.set);

router
	.route('/profile/status')
	/**
	 * @api {get} /user/profile/status Get User Profile Status
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/status
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User profile status returned",
	 *     "status": Object
	 *   }
	 */
	.get(profileModel.getStatus);

router
	.route('/profile/education')
	/**
	 * @api {put} /user/profile/education Set User Education Info
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/education
	 *
	 *   body:
	 *   {
	 *     "education": [
	 *       {
	 *         "degree": "SSC",
	 *         "instituteName": "Test High School",
	 *         "department": "Science",
	 *         "passingYear": 2004
	 *       },
	 *       {
	 *         "degree": "HSC",
	 *         "instituteName": "Test Pilot College",
	 *         "department": "Science",
	 *         "passingYear": 2006
	 *       },
	 *       {
	 *         "degree": "BSC",
	 *         "instituteName": "Test University",
	 *         "department": "CSE",
	 *         "passingYear": 2011
	 *       }
	 *     ]
	 *   }
	 *
	 * @apiParam {[Object]} education Education object (required).
	 * @apiParam {String} education.degree Acquired Degree or Certificate (required) (Minimum 2 and maximum 10 characters).
	 * @apiParam {String} education.instituteName Name of School, College or University (required) (Minimum 5 and maximum 100 characters).
	 * @apiParam {String} education.department Name of Group or Department (required) (Minimum 3 and maximum 100 characters).
	 * @apiParam {Number} education.passingYear Passing year (required) (Minimum 1970 and maximum current year).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User education info updated",
	 *     "profile": Object
	 *   }
	 */
	.put(profileModel.setEducation);

router
	.route('/profile/work')
	/**
	 * @api {put} /user/profile/work Set User Work Info
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/work
	 *
	 *   body:
	 *   {
	 *     "work": [
	 *       {
	 *         "workplaceName": "Owlette",
	 *         "address": "Akhalia, Sylhet",
	 *         "designation": "Software Architect",
	 *         "startDate": 1278379245137,
	 *         "endDate": 1676163858979
	 *       },
	 *       {
	 *         "workplaceName": "Quantic Dynamics",
	 *         "address": "UTC Tower, Panthapath",
	 *         "department": "Tech",
	 *         "designation": "Software Architect",
	 *         "startDate": 1278379245137
	 *       }
	 *     ]
	 *   }
	 *
	 * @apiParam {[Object]} work Work object (required).
	 * @apiParam {String} work.workplaceName Name of the workplace or company (required) (Minimum 5 and maximum 100 characters).
	 * @apiParam {String} work.address Address of the workplace (optional) (Minimum 5 and maximum 100 characters).
	 * @apiParam {String} work.department Work Department (optional) (Minimum 3 and maximum 50 characters).
	 * @apiParam {String} work.designation Designation at the workplace (required) (Minimum 3 and maximum 50 characters).
	 * @apiParam {Number} work.startDate Work start date (required) (in millis).
	 * @apiParam {Number} work.endDate Work end date (optional) (in millis).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User work info updated",
	 *     "profile": Object
	 *   }
	 */
	.put(profileModel.setWork);

router
	.route('/profile/active')
	/**
	 * @api {put} /user/profile/active Set User Profile Active Status
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/active
	 *
	 *   body:
	 *   {
	 *     "active": true
	 *   }
	 *
	 * @apiParam {Boolean} active Profile active status (true for active and false for inactive) (default: true).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User profile active status updated",
	 *     "profile": Object
	 *   }
	 */
	.put(profileModel.setProfileActiveStatus);

router
	.route('/profile/photo')
	/**
	 * @api {post} /user/profile/photo Upload Profile Photos
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type multipart/form-data
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/photo
	 *
	 *   body:
	 *   {
	 *     "photos": test.jpg, image.png
	 *   }
	 *
	 * @apiParam {File} photos Profile photos (required) (Max 5 photos with max 5 MB size each).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User profile photos uploaded",
	 *     "profile": Object
	 *   }
	 */
	.post(storage.uploadProfile.array('photos', 5), profileModel.uploadPhotos)
	/**
	 * @api {put} /user/profile/photo Remove and Rearrange Profile Photos
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/photo
	 *
	 *   body:
	 *   {
	 *     "filenames": ["678xax68stxg.jpg", "678rfx68stxg-999000.jpg"]
	 *   }
	 *
	 * @apiParam {[String]} filenames Filenames of the selected photos in preferred order (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User profile photos updated",
	 *     "profile": Object
	 *   }
	 */
	.put(profileModel.updatePhotos);

router
	.route('/profile/preference')
	/**
	 * @api {get} /user/profile/preference Get User Preference
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/preference
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User preference returned",
	 *     "preference": Object
	 *   }
	 */
	.get(profileModel.getPreference)
	/**
	 * @api {put} /user/profile/preference Set User Preference
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/preference
	 *
	 *   body:
	 *   {
	 *     "relationshipStatuses": ["Single"],
	 *     "ageMin": 18,
	 *     "ageMax": 25,
	 *     "heightMin": 66,
	 *     "heightMax": 70,
	 *     "weightMin": 66,
	 *     "weightMax": 85,
	 *     "districts": ["Dhaka", "Chittagong", "Comilla"],
	 *     "nationalities": ["Bangladeshi"]
	 *   }
	 *
	 * @apiParam {[String]} relationshipStatuses Preferred Relationship statuses (default: UNCHANGED) ('Single', 'Divorced' or 'Widowed').
	 * @apiParam {Number} ageMin Preferred Minimum Age (default: UNCHANGED) (Minimum 18 and maximum 150 years).
	 * @apiParam {Number} ageMax Preferred Maximum Age (default: UNCHANGED) (Minimum 18 and maximum 150 years).
	 * @apiParam {Number} heightMin Preferred Minimum Height (default: UNCHANGED) (Minimum 36 and maximum 96 inches).
	 * @apiParam {Number} heightMax Preferred Maximum Height (default: UNCHANGED) (Minimum 36 and maximum 96 inches).
	 * @apiParam {Number} weightMin Preferred Minimum Weight (default: UNCHANGED) (Minimum 30 and maximum 150 KG).
	 * @apiParam {Number} weightMax Preferred Maximum Weight (default: UNCHANGED) (Minimum 30 and maximum 150 KG).
	 * @apiParam {[String]} districts Preferred Districts (default: UNCHANGED).
	 * @apiParam {[String]} nationalities Preferred Nationalities (default: UNCHANGED) ('Bangladeshi' or 'Other').
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User preference updated",
	 *     "preference": Object
	 *   }
	 */
	.put(profileModel.setPreference);

router
	.route('/profile/param')
	/**
	 * @api {get} /user/profile/param Get Available Profile Parameters
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/param
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all profile parameters",
	 *     "profileParams": [Object]
	 *   }
	 */
	.get(profileModel.getAllParams)
	/**
	 * @api {put} /user/profile/param Update/Set User Profile Parameter
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/param
	 *
	 *   body:
	 *   {
	 *     "paramName": "Nominee_Name",
	 *     "paramValue": "John Doe"
	 *   }
	 *
	 * @apiParam {String} paramName Parameter name (required).
	 * @apiParam {String} paramValue Value of the parameter (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User profile parameter updated",
	 *     "user": Object
	 *   }
	 */
	.put(profileModel.setParams);

router
	.route('/profile/email')
	/**
	 * @api {get} /user/profile/email Get Email Verification Link
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/email
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Verification email sent"
	 *   }
	 */
	.get(profileModel.getEmailOTP)
	/**
	 * @api {put} /user/profile/email Update/Set Email
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/email
	 *
	 *   body:
	 *   {
	 *     "email": "test@test.org"
	 *   }
	 *
	 * @apiParam {String} email New Email address (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Verification email sent"
	 *   }
	 */
	.put(profileModel.setEmail)
	/**
	 * @api {delete} /user/profile/email Remove Unverified Email
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/email
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Unverified email removed successfully",
	 *     "user": Object
	 *   }
	 */
	.delete(profileModel.removeEmail);

router
	.route('/profile/nid/front')
	/**
	 * @api {post} /user/profile/nid/front Detect NID Front Side
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/nid/front
	 *
	 *   body:
	 *   {
	 *     "base64": "gicsd76tcaibfsef"
	 *   }
	 *
	 * @apiParam {String} base64 Front-image base64 string (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "NID frontside detected"
	 *     "result": {
	 *       "name": "John Doe",
	 *       "dob": "01 Jan 1971",
	 *       "nid": "4563219870"
	 *     }
	 *   }
	 */
	.post(profileModel.setNidFront);

router
	.route('/profile/nid/back')
	/**
	 * @api {post} /user/profile/nid/back Detect NID Back Side / Verify NID
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/nid/back
	 *
	 *   body:
	 *   {
	 *     "base64": "87bwfoyugwrfygvwo"
	 *   }
	 *
	 * @apiParam {String} base64 Back-image base64 string (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "NID backside detected"
	 *   }
	 */
	.post(profileModel.setNidBack);

router
	.route('/profile/password')
	/**
	 * @api {put} /user/profile/password Update Password
	 * @apiVersion 1.0.0
	 * @apiGroup User_Profile
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:3586/user/profile/password
	 *
	 *   body:
	 *   {
	 *     "oldPassword": "87bwfoyugwrfygvwo",
	 *     "newPassword": "87bwfHYGYFTFgwrfygvwo"
	 *   }
	 *
	 * @apiParam {String} oldPassword Old password (required).
	 * @apiParam {String} newPassword New password (required).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "User password updated",
	 *     "user": Object
	 *   }
	 */
	.put(profileModel.setPassword);

///////////////////////////
// Match API
// /user/match
///////////////////////////

router.route('/match')
	/**
	 * @api {get} /user/match Get All Active Matches
	 * @apiVersion 1.0.0
	 * @apiGroup User_Match
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/match
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all active matches",
	 *     "matches": [Object]
	 *   }
	 */
	.get(matchModel.getAll)
	/**
	 * @api {post} /user/match Generate Daily Matches
	 * @apiVersion 1.0.0
	 * @apiGroup User_Match
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/match
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Generated matches for today",
	 *     "matches": [Object]
	 *   }
	 */
	.post(matchModel.generate);

router.route('/match/:id')
	/**
	 * @api {post} /user/match/:id Like a Matching User
	 * @apiVersion 1.0.0
	 * @apiGroup User_Match
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/match/h97hcw97wghrc
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully liked user from match",
	 *     "match": Object
	 *   }
	 */
	.post(matchModel.like)
	/**
	 * @api {put} /user/match/:id Dislike a Matching User
	 * @apiVersion 1.0.0
	 * @apiGroup User_Match
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/match/h97hcw97wghrc
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully disliked user from match",
	 *     "match": Object
	 *   }
	 */
	.put(matchModel.dislike)
	/**
	 * @api {delete} /user/match/:id Break a successful Match
	 * @apiVersion 1.0.0
	 * @apiGroup User_Match
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/match/h97hcw97wghrc
	 *
	 *   body:
	 *   {
	 *     "reason": "Here is the match breaking reason"
	 *   }
	 *
	 * @apiParam {String} reason Reason of breaking match (default: UNDEFINED).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Successfully broken with matched user",
	 *     "match": Object
	 *   }
	 */
	.delete(matchModel.breakMatch);

///////////////////////////
// Conversation API
// /user/conversation
///////////////////////////

router.route('/conversation')
	/**
	 * @api {get} /user/conversation Get All Conversations
	 * @apiVersion 1.0.0
	 * @apiGroup User_Conversation
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/conversation
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all conversations",
	 *     "conversations": [Object]
	 *   }
	 */
	.get(conversationModel.getAll);

router.route('/conversation/:id/messages')
	/**
	 * @api {post} /user/conversation/:id/messages Get Messages from Conversation
	 * @apiVersion 1.0.0
	 * @apiGroup User_Conversation
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/conversation/6b5675f8576rg87r/messages
	 *
	 *   body:
	 *   {
	 *     "slice": {
	 *       "size": 20,
	 *       "skip": 0
	 *     }
	 *   }
	 *
	 * @apiParam {Object} slice Conversation slice config object (default: undefined).
	 * @apiParam {Number} slice.size Size of conversation slice (min: 10, max: 500) (default: 50).
	 * @apiParam {Number} slice.skip number of messages you want to skip from the latest (min: 0) (default: 0).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned messages from conversation",
	 *     "slice": {
	 *       "totalMessages": 356,
	 *       "size": 20,
	 *       "skip": 0
	 *     },
	 *     "messages": [Object]
	 *   }
	 */
	.post(conversationModel.getMessages);

///////////////////////////
// Activity API
// /user/activity
///////////////////////////

router.route('/activity')
	/**
	 * @api {post} /user/activity Get Activities
	 * @apiVersion 1.0.0
	 * @apiGroup User_Activity
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/activity
	 *
	 *   body:
	 *   {
	 *     "slice": {
	 *       "size": 20,
	 *       "skip": 0
	 *     }
	 *   }
	 *
	 * @apiParam {Object} slice Activity slice config object (default: undefined).
	 * @apiParam {Number} slice.size Size of activity slice (min: 10, max: 500) (default: 50).
	 * @apiParam {Number} slice.skip number of activities you want to skip from the latest (min: 0) (default: 0).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned activities",
	 *     "slice": {
	 *       "totalMessages": 356,
	 *       "size": 20,
	 *       "skip": 0
	 *     },
	 *     "activities": [Object]
	 *   }
	 */
	.post(activityModel.get);

///////////////////////////
// UserProduct API
// /user/user-product
///////////////////////////

router
	.route('/user-product')
	/**
	 * @api {get} /user/user-product Get All UserProducts
	 * @apiVersion 1.0.0
	 * @apiGroup User_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/user-product
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all userProducts",
	 *     "userProducts": [Object]
	 *   }
	 */
	.get(userProductModel.getAll)
	/**
	 * @api {post} /user/user-product Get UserProduct with Pagination
	 * @apiVersion 1.0.0
	 * @apiGroup User_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/user-product
	 *
	 *   body:
	 *   {
	 *     "oldestFirst": false,
	 *     "pagination": {
	 *       "itemsPerPage": 5,
	 *       "pageIndex": 2
	 *     }
	 *   }
	 *
	 * @apiParam {Boolean} oldestFirst Sort results from oldest to newest or not (default: false).
	 * @apiParam {Object} pagination Pagination config object (default: undefined).
	 * @apiParam {Number} pagination.itemsPerPage Number of items per page (min: 5, max: 500) (default: 20).
	 * @apiParam {Number} pagination.pageIndex Page index you want to view (min: 1) (default: 1).
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned userProducts",
	 *     "pagination": {
	 *       "totalItems": 32,
	 *       "itemsPerPage": 5,
	 *       "totalPages": 7,
	 *       "pageIndex": 2
	 *     },
	 *     "userProducts": [Object]
	 *   }
	 */
	.post(userProductModel.getData);

router
	.route('/user-product/payment')
	/**
	 * @api {get} /user/user-product/payment Get All Payments
	 * @apiVersion 1.0.0
	 * @apiGroup User_UserProduct
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/user-product/payment
	 *
	 * @apiSuccessExample {json} Success Response:
	 *   HTTP/1.1 200 OK
	 *   {
	 *     "state": "success",
	 *     "message": "Returned all payments",
	 *     "payments": [Object]
	 *   }
	 */
	.get(userProductModel.getAllPayments);

///////////////////////////
// Support API
// /user/support
///////////////////////////

router
	.route('/support/contact')
	/**
	 * @api {post} /user/support/contact Contact Support
	 * @apiVersion 1.0.0
	 * @apiGroup User_Support
	 * @apiHeader {String} Content-Type application/json
	 * @apiHeader {String} app-key App specific access key
	 * @apiHeader {String} user-key User access key
	 * @apiHeader {String} instance-key Notification token provided when authenticated
	 * @apiExample Example Usage:
	 *   url: http://localhost:6259/user/support/contact
	 *
	 *   body:
	 *   {
	 *     "replyEmail": "replyme@example.com",
	 *     "destinationEmail": "destination@example.com",
	 *     "topic": "Others",
	 *     "message": "How to get quote?"
	 *   }
	 *
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
/* eslint-enable max-len */

module.exports = router;
