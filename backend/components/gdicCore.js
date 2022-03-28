var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var rp = require('request-promise');
// var notification = require('./notification');
var dateTime = require('./dateTime');
var log = require('./log');
var incremental = require('./incremental');
var policyDoc = require('./policyDoc');
var gdic = require('./../secrets/gdicSecret');
var sAdmin = require('./../secrets/superAdmin');

// Models
var User = mongoose.model('User');
var UserProduct = mongoose.model('UserProduct');

// Functions
/* eslint-disable no-console */
function syncPolicy(policy_id) {
	console.log(policy_id + ' - LOG: Started GDIC Core Policy Document Sync');
	UserProduct.findById(policy_id, function (err, policy) {
		if (err) {
			console.log(policy_id + ' - ERROR: Error fetching policy');
			console.log(err);
		} else {
			User.findById(policy.user_id, function (err, user) {
				if (err) {
					console.log(policy_id + ' - ERROR: Error fetching user');
					console.log(err);
				} else {
					if (policy.productCode === 'NIB' || policy.productCode === 'PPA') {
						prepPersonalAccidentPolicy(user, policy);
					} else if (policy.productCode === 'MTR') {
						prepMotorPolicy(user, policy);
					} else if (policy.productCode === 'B&H') {
						prepTravelPolicy(user, policy);
					}
				}
			});
		}
	});
}

function prepPersonalAccidentPolicy(user, policy) {
	// User State
	var userIsNew = true;
	var gdicCoreId = '';
	if (user.gdicCoreId !== '') {
		userIsNew = false;
		gdicCoreId = user.gdicCoreId;
	}

	// Policy State
	var policyIsNew = true;
	var rIndex = -1;
	var oldDocId = undefined;
	if (policy.renewals.length > 0) {
		policyIsNew = false;
		rIndex = policy.renewals.indexOf(
			policy.renewals.find(item => item.docSynced === 0)
		);
		if (rIndex === 0) {
			oldDocId = policy.doc_id;
		} else {
			oldDocId = policy.renewals[rIndex - 1].doc_id;
		}
	}

	// App key
	var appKey = {};
	appKey = sAdmin.appKeys.find(function (item) {
		if (policyIsNew) return item.name === policy.appName;
		else return item.name === policy.renewals[rIndex].appName;
	});

	// from user
	var dob = parseInt(
		user.profileParams.filter(function (item) {
			return item.paramName === 'Date_Of_Birth';
		})[0].paramValue
	);

	// from policy
	var address = policy.productParams.filter(function (item) {
		return item.paramName === 'Delivery_Address';
	})[0].paramValue;
	var nomineeName = policy.productParams.filter(function (item) {
		return item.paramName === 'Nominee_Name';
	})[0].paramValue;
	var nomineeRelationship = policy.productParams.filter(function (item) {
		return item.paramName === 'Nominee_Relationship';
	})[0].paramValue;
	var premiumRate = policy.productParams.filter(function (item) {
		return item.paramName === 'Premium_Rate';
	})[0].paramValue;
	var vatRate = policy.productParams.filter(function (item) {
		return item.paramName === 'Vat_Rate';
	})[0].paramValue;
	var premium = policy.productParams.filter(function (item) {
		return item.paramName === 'Net_Premium';
	})[0].paramValue;
	var sumInsured = policy.productParams.filter(function (item) {
		return item.paramName === 'Sum_Insured';
	})[0].paramValue;
	var vat = policy.productParams.filter(function (item) {
		return item.paramName === 'Vat';
	})[0].paramValue;
	var stampCharge = policy.productParams.filter(function (item) {
		return item.paramName === 'Stamp_Duty';
	})[0].paramValue;
	var totalAmount = policy.productParams.filter(function (item) {
		return item.paramName === 'Total_Premium';
	})[0].paramValue;

	var docOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'personalAccident',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				docID: policyIsNew ? policy.doc_id : policy.renewals[rIndex].doc_id,
				personalAccident: {
					customerStatus: userIsNew ? 'NEW' : 'EXISTING',
					id: userIsNew ? undefined : gdicCoreId,
					name: user.fullname,
					presentAddress: address,
					permanentAddress: address,
					occupation: '',
					mobileNo: user.mobileNo,
					fax: '',
					email: user.email ? user.email : '',
					dateOfBirth: dateTime.jsToMysql(dob, true),
					nationalID: user.nid,
					passportNo: '',
					fatherName: '',
					motherName: '',
					nationality: 'Bangladeshi',
					beneficiaryName: nomineeName,
					nomineeRelationship: nomineeRelationship,
					nomineeName: nomineeName,
					husbandName: '',
					relationship: '',
					cityName: 'dhaka',
					gender: '',
					age: new Date().getFullYear() - new Date(dob).getFullYear(),
					docDate: dateTime.jsToMysql(
						policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
						true
					),
					businessStatus: userIsNew ? 'NEW' : 'EXISTING',
					policyStartDate: dateTime.jsToMysql(
						policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
						false
					),
					policyEndDate: dateTime.jsToMysql(
						policyIsNew ? policy.expiresAt : policy.renewals[rIndex].expiresAt,
						false
					),
					planName: policy.group,
					planType: policy.subGroup,
					infoSource: 'Media',
					sourceMedium: '',
					empCodeOrOtherInfo: '',
					totalDays: 365,
					previousDocID: oldDocId,
					premium: parseFloat(premium),
					premiumRate: parseFloat(premiumRate),
					vatRate: parseFloat(vatRate),
					vat: parseFloat(vat),
					stampCharge: parseFloat(stampCharge),
					discount: 0.0,
					totalAmount: parseFloat(totalAmount),
					sumInsured: parseFloat(sumInsured)
				}
			}
		}
	};

	var receiptOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'moneyReceipt',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: policyIsNew
					? policy.bill.payment.receiptNo
					: policy.renewals[rIndex].bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: policyIsNew ? policy.doc_id : policy.renewals[rIndex].doc_id,
						mtId: '0',
						branchCode: policyIsNew
							? policy.doc_id.slice(4, 7)
							: policy.renewals[rIndex].doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						deptCode: 'MSC',
						classCode: policyIsNew
							? policy.doc_id.slice(16, 19)
							: policy.renewals[rIndex].doc_id.slice(16, 19),
						currencyType: 'BDT',
						currencyRate: 1.0,
						netPremium: parseFloat(premium),
						vatAmount: parseFloat(vat),
						stampDutyRec: parseFloat(stampCharge),
						coInspayable: 0.0,
						grossPremium: parseFloat(totalAmount),
						stampDutyNon: 0.0,
						docno_all: '',
						remarks: '',
						pcRate: 0.0,
						procurementCost: 0.0,
						refund: 0.0,
						outStandingStatus: '',
						creditStatus: 'YES',
						mrSlNo: '0',
						netOs: '0.00',
						vtOs: '0.00',
						stOs: '0.00',
						lastCreditDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: policyIsNew
								? policy.doc_id.slice(4, 7)
								: policy.renewals[rIndex].doc_id.slice(4, 7),
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							mrDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							department: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							mrPremium: parseFloat(premium),
							mrVat: parseFloat(vat),
							mrStampDuty: parseFloat(stampCharge),
							coInsPayable: 0.0,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							purpose: '',
							classCode: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							deptCode: 'MSC',
							activeStatus: 'YES',
							fcType: 'BDT',
							fcRate: 1.0,
							credited: false
						}
					],
					firstMrStatusDetails: [
						{
							slNo: 1,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							depositDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							depositSlipNo: '111',
							depositAmount: parseFloat(totalAmount),
							accountNo: policyIsNew
								? policy.bill.payment.accountNo
								: policy.renewals[rIndex].bill.payment.accountNo,
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							collectionStatus: 'COLLECTION',
							sMsDeliveryDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							currencyType: 'BDT',
							currencyRate: 1.0
						}
					],
					secondMrStatusDetails: [
						{
							othersCharge: '0',
							slNo: 1,
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							depositNet: parseFloat(premium),
							depositVat: parseFloat(vat),
							depositNetOthers: 0.0,
							depositStampRec: parseFloat(stampCharge)
						}
					]
				}
			}
		}
	};
	sendPolicy(docOption, receiptOption, user, policy);
}

function prepMotorPolicy(user, policy) {
	// User State
	var userIsNew = true;
	var gdicCoreId = '';
	if (user.gdicCoreId !== '') {
		userIsNew = false;
		gdicCoreId = user.gdicCoreId;
	}

	// Policy State
	var policyIsNew = true;
	var rIndex = -1;
	var oldDocId = '';
	if (policy.renewals.length > 0) {
		policyIsNew = false;
		rIndex = policy.renewals.indexOf(
			policy.renewals.find(item => item.docSynced === 0)
		);
		if (rIndex === 0) {
			oldDocId = policy.doc_id;
		} else {
			oldDocId = policy.renewals[rIndex - 1].doc_id;
		}
	}

	// App key
	var appKey = {};
	appKey = sAdmin.appKeys.find(function (item) {
		if (policyIsNew) return item.name === policy.appName;
		else return item.name === policy.renewals[rIndex].appName;
	});

	// from user
	// var address = user.profileParams.filter(function (item) {
	// 	return item.paramName === 'Address';
	// })[0].paramValue;
	var dob = parseInt(
		user.profileParams.filter(function (item) {
			return item.paramName === 'Date_Of_Birth';
		})[0].paramValue
	);

	// from policy
	var userProductParams = {};
	policy.productParams.forEach(function (item) {
		userProductParams[item.paramName] = item.paramValue;
	});

	var docOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'motor',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				docID: policyIsNew ? policy.doc_id : policy.renewals[rIndex].doc_id,
				motor: {
					// User info
					customerStatus: userIsNew ? 'NEW' : 'EXISTING',
					id: userIsNew ? undefined : gdicCoreId,
					name: user.fullname,
					presentAddress: userProductParams.Delivery_Address,
					permanentAddress: userProductParams.Delivery_Address,
					mobileNo: user.mobileNo,
					fax: '',
					email: user.email ? user.email : '',
					dateOfBirth: dateTime.jsToMysql(dob, true),
					nationalID: user.nid,
					passportNo: '',
					fatherName: '',
					motherName: '',
					nationality: 'Bangladeshi',
					gender: '',
					age: new Date().getFullYear() - new Date(dob).getFullYear(),
					businessStatus: userIsNew ? 'NEW' : 'EXISTING',
					docDate: dateTime.jsToMysql(
						policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
						true
					),
					planName: 'ActLiability',
					policyStartDate: dateTime.jsToMysql(
						policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
						false
					),
					// dateTime.jsToMysql(
					// 	parseInt(userProductParams.Policy_Start_Date), true),
					policyEndDate: dateTime.jsToMysql(
						policyIsNew ? policy.expiresAt : policy.renewals[rIndex].expiresAt,
						false
					),
					// dateTime.jsToMysql(
					// 	parseInt(userProductParams.Policy_End_Date), true),
					totalDays: 365,
					infoSource: 'Media',
					sourceMedium: '',
					otherInfo: '',
					issuePlace: appKey.name,
					previousDocID: oldDocId,

					// Motor info
					vehicleClass: userProductParams.Vehicle_Usage,
					vehicleMake: userProductParams.Vehicle_Make,
					makeYear: userProductParams.Make_Year,
					regMarkNo: userProductParams.Registration_No,
					chessisNo: userProductParams.Chassis_No,
					cubicCapacity: userProductParams.CC,
					engineNo: userProductParams.Engine_No,
					regAuthorityName: '',
					vehicleType: userProductParams.Vehicle_Type,
					registrationAuthority: 'B.R.T.A',
					passengerAmount: parseFloat(userProductParams.Passenger_Amount),
					driverAmount: parseFloat(userProductParams.Driver_Amount),
					// helperAmount: parseFloat(userProductParams.Helper_Amount),
					amount: parseFloat(userProductParams.Act_Liability),
					vatRate: parseFloat(userProductParams.Vat_Rate),
					vat: parseFloat(userProductParams.Vat),
					discount: 0,
					// totalAmount: parseFloat(userProductParams.Total_Premium),
					netPremium: parseFloat(userProductParams.Net_Premium),
					grossPremium: parseFloat(userProductParams.Total_Premium),
					sumInsured: 0,
					motorDetails: {
						goodCapacity: userProductParams.Ton,
						seatingCapacity: parseInt(userProductParams.Seat),
						numOfPassenger: parseInt(userProductParams.Passenger),
						numOfDrivers: parseInt(userProductParams.Driver),
						numOfHelpers: parseInt(userProductParams.Helper),
						numOfConductors: 0,
						numOfGuides: 0,
						numOfLumpSum: 0,
						actBasicRate: parseFloat(userProductParams.Act_Liability),
						actBasicAmount: parseFloat(userProductParams.Act_Liability),
						passengerRate: parseFloat(userProductParams.Passenger_Rate),
						passengerAmount: parseFloat(userProductParams.Passenger_Amount),
						driverRate: parseFloat(userProductParams.Driver_Rate),
						driverAmount: parseFloat(userProductParams.Driver_Amount),
						helperRate: parseFloat(userProductParams.Helper_Rate),
						helperAmount: parseFloat(userProductParams.Helper_Amount),
						conductorRate: 0,
						conductorAmount: 0,
						guideRate: 0,
						guideAmount: 0,
						lumpSumRate: 0,
						lumpSumAmount: 0
					}
				}
			}
		}
	};

	var receiptOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'moneyReceipt',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: policyIsNew
					? policy.bill.payment.receiptNo
					: policy.renewals[rIndex].bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: policyIsNew ? policy.doc_id : policy.renewals[rIndex].doc_id,
						mtId: '0',
						branchCode: policyIsNew
							? policy.doc_id.slice(4, 7)
							: policy.renewals[rIndex].doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						deptCode: 'MSC',
						classCode: policyIsNew
							? policy.doc_id.slice(16, 19)
							: policy.renewals[rIndex].doc_id.slice(16, 19),
						currencyType: 'BDT',
						currencyRate: 1.0,
						netPremium: parseFloat(userProductParams.Net_Premium),
						vatAmount: parseFloat(userProductParams.Vat),
						stampDutyRec: 0.0,
						coInspayable: 0.0,
						grossPremium: parseFloat(userProductParams.Total_Premium),
						stampDutyNon: 0.0,
						docno_all: '',
						remarks: '',
						pcRate: 0.0,
						procurementCost: 0.0,
						refund: 0.0,
						outStandingStatus: '',
						creditStatus: 'YES',
						mrSlNo: '0',
						netOs: '0.00',
						vtOs: '0.00',
						stOs: '0.00',
						lastCreditDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: policyIsNew
								? policy.doc_id.slice(4, 7)
								: policy.renewals[rIndex].doc_id.slice(4, 7),
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							mrDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							department: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							mrPremium: parseFloat(userProductParams.Net_Premium),
							mrVat: parseFloat(userProductParams.Vat),
							mrStampDuty: 0.0,
							coInsPayable: 0.0,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							purpose: '',
							classCode: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							deptCode: 'MSC',
							activeStatus: 'YES',
							fcType: 'BDT',
							fcRate: 1.0,
							credited: false
						}
					],
					firstMrStatusDetails: [
						{
							slNo: 1,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							depositDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							depositSlipNo: '111',
							depositAmount: parseFloat(userProductParams.Total_Premium),
							accountNo: policyIsNew
								? policy.bill.payment.accountNo
								: policy.renewals[rIndex].bill.payment.accountNo,
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							collectionStatus: 'COLLECTION',
							sMsDeliveryDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							currencyType: 'BDT',
							currencyRate: 1.0
						}
					],
					secondMrStatusDetails: [
						{
							othersCharge: '0',
							slNo: 1,
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							depositNet: parseFloat(userProductParams.Net_Premium),
							depositVat: parseFloat(userProductParams.Vat),
							depositNetOthers: 0.0,
							depositStampRec: 0.0
						}
					]
				}
			}
		}
	};
	sendPolicy(docOption, receiptOption, user, policy);
}

function prepTravelPolicy(user, policy) {
	// User State
	var userIsNew = true;
	var gdicCoreId = '';
	if (user.gdicCoreId !== '') {
		userIsNew = false;
		gdicCoreId = user.gdicCoreId;
	}

	// Policy State
	// var policyIsNew = true;
	// var rIndex = -1;
	// var oldDocId = '';
	// if (policy.renewals.length > 0) {
	// 	policyIsNew = false;
	// 	rIndex = policy.renewals.indexOf(
	// 		policy.renewals.find(item => item.docSynced === 0));
	// 	if (rIndex === 0) {
	// 		oldDocId = policy.doc_id;
	// 	} else {
	// 		oldDocId = policy.renewals[rIndex-1].doc_id;
	// 	}
	// }

	// App key
	var appKey = {};
	appKey = sAdmin.appKeys.find(function (item) {
		return item.name === policy.appName;
	});

	// from user
	// var address = user.profileParams.filter(function (item) {
	// 	return item.paramName === 'Address';
	// })[0].paramValue;
	var dob = parseInt(
		user.profileParams.filter(function (item) {
			return item.paramName === 'Date_Of_Birth';
		})[0].paramValue
	);

	// from policy
	var userProductParams = {};
	policy.productParams.forEach(function (item) {
		userProductParams[item.paramName] = item.paramValue;
	});

	var docOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'travel',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				docID: policy.doc_id,
				// policyIsNew ? policy.doc_id : policy.renewals[rIndex].doc_id,
				travel: {
					customerStatus: userIsNew ? 'NEW' : 'EXISTING',
					id: userIsNew ? undefined : gdicCoreId,
					name: user.fullname,
					presentAddress: userProductParams.Delivery_Address,
					permanentAddress: userProductParams.Delivery_Address,
					mobileNo: user.mobileNo,
					fax: '',
					email: user.email ? user.email : '',
					dateOfBirth: dateTime.jsToMysql(dob, true),
					nationalID: user.nid,
					passportNo: userProductParams.Passport_No,
					fatherName: '',
					motherName: '',
					nationality: 'Bangladeshi',
					gender: '',
					age: new Date().getFullYear() - new Date(dob).getFullYear(),
					docDate: dateTime.jsToMysql(false, true),
					businessStatus: userIsNew ? 'NEW' : 'EXISTING',
					departureCountry: userProductParams.Departure_Country,
					departureDateTime: dateTime.jsToMysql(
						parseInt(userProductParams.Departure_Date),
						false
					),
					returnDateTime: dateTime.jsToMysql(
						parseInt(userProductParams.Return_Date),
						false
					),
					planName: policy.name,
					returnDays: Math.ceil(
						(parseInt(userProductParams.Return_Date) -
							parseInt(userProductParams.Departure_Date)) /
							(1000 * 60 * 60 * 24)
					),
					infoSource: 'Media',
					sourceMedium: '',
					empCodeOrOtherInfo: '',
					totalDays: Math.ceil(
						(parseInt(userProductParams.Return_Date) -
							parseInt(userProductParams.Departure_Date)) /
							(1000 * 60 * 60 * 24)
					),
					premium: parseFloat(userProductParams.Net_Premium),
					vatRate: parseFloat(userProductParams.Vat_Rate),
					vat: parseFloat(userProductParams.Vat),
					stampCharge: parseFloat(userProductParams.Stamp_Duty),
					discount: 0.0,
					totalAmount: parseFloat(userProductParams.Total_Premium)
				}
			}
		}
	};

	var receiptOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'moneyReceipt',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: policy.bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: policy.doc_id,
						mtId: '0',
						branchCode: policy.doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(false, true),
						deptCode: 'MSC',
						classCode: policy.doc_id.slice(16, 19),
						currencyType: 'BDT',
						currencyRate: 1.0,
						netPremium: parseFloat(userProductParams.Net_Premium),
						vatAmount: parseFloat(userProductParams.Vat),
						stampDutyRec: parseFloat(userProductParams.Stamp_Duty),
						coInspayable: 0.0,
						grossPremium: parseFloat(userProductParams.Total_Premium),
						stampDutyNon: 0.0,
						docno_all: '',
						remarks: '',
						pcRate: 0.0,
						procurementCost: 0.0,
						refund: 0.0,
						outStandingStatus: '',
						creditStatus: 'YES',
						mrSlNo: '0',
						netOs: '0.00',
						vtOs: '0.00',
						stOs: '0.00',
						lastCreditDate: dateTime.jsToMysql(false, true),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: policy.doc_id.slice(4, 7),
							docNo: policy.doc_id,
							mrDate: dateTime.jsToMysql(false, true),
							department: policy.doc_id.slice(16, 19),
							mrPremium: parseFloat(userProductParams.Net_Premium),
							mrVat: parseFloat(userProductParams.Vat),
							mrStampDuty: parseFloat(userProductParams.Stamp_Duty),
							coInsPayable: 0.0,
							payMode: policy.bill.gateway,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(false, true),
							purpose: '',
							classCode: policy.doc_id.slice(16, 19),
							deptCode: 'MSC',
							activeStatus: 'YES',
							fcType: 'BDT',
							fcRate: 1.0,
							credited: false
						}
					],
					firstMrStatusDetails: [
						{
							slNo: 1,
							payMode: policy.bill.gateway,
							depositDate: dateTime.jsToMysql(false, true),
							depositSlipNo: '111',
							depositAmount: parseFloat(userProductParams.Total_Premium),
							accountNo: policy.bill.payment.accountNo,
							creditDate: dateTime.jsToMysql(false, true),
							collectionStatus: 'COLLECTION',
							sMsDeliveryDate: dateTime.jsToMysql(false, true),
							currencyType: 'BDT',
							currencyRate: 1.0
						}
					],
					secondMrStatusDetails: [
						{
							othersCharge: '0',
							slNo: 1,
							docNo: policy.doc_id,
							depositNet: parseFloat(userProductParams.Net_Premium),
							depositVat: parseFloat(userProductParams.Vat),
							depositNetOthers: 0.0,
							depositStampRec: parseFloat(userProductParams.Stamp_Duty)
						}
					]
				}
			}
		}
	};
	sendPolicy(docOption, receiptOption, user, policy);
}

function sendPolicy(docOption, receiptOption, user, policy) {
	console.log(policy._id + ' - LOG: Initiating policy sync');
	// User State
	var userIsNew = true;
	if (user.gdicCoreId !== '') {
		userIsNew = false;
	}

	// Policy State
	var policyIsNew = true;
	var rIndex = -1;
	if (policy.renewals.length > 0) {
		policyIsNew = false;
		rIndex = policy.renewals.indexOf(
			policy.renewals.find(item => item.docSynced === 0)
		);
	}

	rp(docOption)
		.then(function (dRes) {
			console.log(policy._id + ' - LOG: GDIC Core API responded');
			if (dRes.replyStatus.result === 'success') {
				console.log(
					policy._id + ' - LOG: GDIC Core API accepted policy document'
				);
				var oldPolicy = Object.assign({}, policy);
				if (policyIsNew) {
					policy.docSynced = dateTime.now();
				} else {
					policy.renewals[rIndex].docSynced = dateTime.now();
				}
				// Create log
				var newPolicy = Object.assign({}, policy);
				var details = 'Policy doc synced with GDIC Core';
				var appName = 'NONE';
				var appKey = 'NONE';
				log
					.create(
						'update',
						details,
						'UserProduct',
						oldPolicy,
						newPolicy,
						appName,
						appKey,
						'NONE',
						'System'
					)
					.then(
						function (pLog) {
							console.log(policy._id + ' - LOG: System Log created');
							policy.updates.push({
								dateTime: dateTime.now(),
								member_id: 'NONE',
								memberType: 'System',
								log_id: pLog._id
							});
							policy.save(function (err, savedPolicy) {
								if (err) {
									console.log(
										policy._id +
											' - ERROR: Error updating policy document sync' +
											' status (success), Paused sending money receipt'
									);
									console.log(err);
								} else {
									console.log(
										savedPolicy._id + ' - LOG: Policy document updated'
									);

									// Notify user
									if (user.notificationToken) {
										var dynamicMessage = '';
										var dynamicLog = '';
										if (userIsNew) {
											dynamicMessage =
												'You have successfully ' +
												'purchased your first policy. ';
											dynamicLog = 'policy purchase';
										} else if (policyIsNew) {
											dynamicMessage =
												'You have successfully purchased your policy. ';
											dynamicLog = 'policy purchase';
										} else {
											dynamicMessage =
												'You have successfully renewed your policy. ';
											dynamicLog = 'policy renewal';
										}
										// notification.send(
										// 	'Congratulation!',
										// 	dynamicMessage + 'You are now protected by Green Delta'
										// 		+ ' Insurance. Your policy will be delivered to you'
										// 		+ ' within the next 48 hours.\nThank you for choosing'
										// 		+ ' Green Delta Insurance.',
										// 	{
										// 		policyId: savedPolicy._id.toString()
										// 	},
										// 	user.notificationToken
										// ).then(function() {
										// 	console.log('Notified user '
										// 		+ user._id + ', about ' + dynamicLog);
										// }, function(err) {
										// 	console.error(err);
										// });
									}

									if (userIsNew) {
										console.log(savedPolicy._id + ' - LOG: Linking new user');
										var gdicCoreId = dRes.replyStatus.remarks
											.split(',')[0]
											.split(':')[1]
											.trim();
										var oldUser = Object.assign({}, user);
										user.gdicCoreId = gdicCoreId;
										// Create log
										var newUser = Object.assign({}, user);
										var details = 'User has been linked with GDIC Core User';
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
													console.log(
														savedPolicy._id + ' - LOG: System Log created'
													);
													user.updates.push({
														dateTime: dateTime.now(),
														member_id: 'NONE',
														memberType: 'System',
														log_id: uLog._id
													});
													user.save(function (err, savedUser) {
														if (err) {
															console.log(
																savedPolicy._id +
																	' - ERROR: Error linking new user,' +
																	' Paused sending money receipt'
															);
															console.log(err);
														} else {
															console.log(
																savedPolicy._id +
																	' - LOG: User linked, ' +
																	'user_id: ' +
																	savedUser._id
															);

															// Delay 5 seconds
															setTimeout(function () {
																sendBill(receiptOption, savedUser, savedPolicy);
															}, 5000);
														}
													});
												},
												function (err) {
													console.log(
														savedPolicy._id +
															' - ERROR: System Log Failed, Error updating' +
															' user sync status (success), Paused sending money receipt'
													);
													console.log(err);
												}
											);
									} else {
										// Delay 5 seconds
										setTimeout(function () {
											sendBill(receiptOption, user, savedPolicy);
										}, 5000);
									}
								}
							});
						},
						function (err) {
							console.log(
								policy._id +
									' - ERROR: System Log Failed, Error updating' +
									' policy document sync status (success), Paused sending money receipt'
							);
							console.log(err);
						}
					);
			} else {
				console.log(
					policy._id +
						' - ERROR: GDIC Core rejected' +
						' policy document, Paused sending money receipt'
				);
				console.log(dRes);
			}
		})
		.catch(function (err) {
			console.log(
				policy._id +
					' - ERROR: Error sending' +
					' policy document and money receipt, GDIC CORE API FAILURE'
			);
			console.log(err);
		});
}

function syncBill(policy_id) {
	console.log(policy_id + ' - LOG: Started GDIC Core Money Receipt Sync');
	UserProduct.findById(policy_id, function (err, policy) {
		if (err) {
			console.log(policy_id + ' - ERROR: Error fetching policy');
			console.log(err);
		} else {
			User.findById(policy.user_id, function (err, user) {
				if (err) {
					console.log(policy_id + ' - ERROR: Error fetching user');
					console.log(err);
				} else {
					if (policy.productCode === 'NIB' || policy.productCode === 'PPA') {
						prepPersonalAccidentBill(user, policy);
					} else if (policy.productCode === 'MTR') {
						prepMotorBill(user, policy);
					} else if (policy.productCode === 'B&H') {
						prepTravelBill(user, policy);
					}
				}
			});
		}
	});
}

function prepPersonalAccidentBill(user, policy) {
	// Policy State
	var policyIsNew = true;
	var rIndex = -1;
	if (policy.renewals.length > 0) {
		policyIsNew = false;
		rIndex = policy.renewals.indexOf(
			policy.renewals.find(item => item.bill.billSynced === 0)
		);
		// if (rIndex === 0) {
		// 	oldDocId = policy.doc_id;
		// } else {
		// 	oldDocId = policy.renewals[rIndex-1].doc_id;
		// }
	}

	// App key
	var appKey = {};
	appKey = sAdmin.appKeys.find(function (item) {
		if (policyIsNew) return item.name === policy.appName;
		else return item.name === policy.renewals[rIndex].appName;
	});

	// from policy
	var premium = policy.productParams.filter(function (item) {
		return item.paramName === 'Net_Premium';
	})[0].paramValue;
	var vat = policy.productParams.filter(function (item) {
		return item.paramName === 'Vat';
	})[0].paramValue;
	var stampCharge = policy.productParams.filter(function (item) {
		return item.paramName === 'Stamp_Duty';
	})[0].paramValue;
	var totalAmount = policy.productParams.filter(function (item) {
		return item.paramName === 'Total_Premium';
	})[0].paramValue;

	var receiptOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'moneyReceipt',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: policyIsNew
					? policy.bill.payment.receiptNo
					: policy.renewals[rIndex].bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: policyIsNew ? policy.doc_id : policy.renewals[rIndex].doc_id,
						mtId: '0',
						branchCode: policyIsNew
							? policy.doc_id.slice(4, 7)
							: policy.renewals[rIndex].doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						deptCode: 'MSC',
						classCode: policyIsNew
							? policy.doc_id.slice(16, 19)
							: policy.renewals[rIndex].doc_id.slice(16, 19),
						currencyType: 'BDT',
						currencyRate: 1.0,
						netPremium: parseFloat(premium),
						vatAmount: parseFloat(vat),
						stampDutyRec: parseFloat(stampCharge),
						coInspayable: 0.0,
						grossPremium: parseFloat(totalAmount),
						stampDutyNon: 0.0,
						docno_all: '',
						remarks: '',
						pcRate: 0.0,
						procurementCost: 0.0,
						refund: 0.0,
						outStandingStatus: '',
						creditStatus: 'YES',
						mrSlNo: '0',
						netOs: '0.00',
						vtOs: '0.00',
						stOs: '0.00',
						lastCreditDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: policyIsNew
								? policy.doc_id.slice(4, 7)
								: policy.renewals[rIndex].doc_id.slice(4, 7),
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							mrDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							department: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							mrPremium: parseFloat(premium),
							mrVat: parseFloat(vat),
							mrStampDuty: parseFloat(stampCharge),
							coInsPayable: 0.0,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							purpose: '',
							classCode: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							deptCode: 'MSC',
							activeStatus: 'YES',
							fcType: 'BDT',
							fcRate: 1.0,
							credited: false
						}
					],
					firstMrStatusDetails: [
						{
							slNo: 1,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							depositDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							depositSlipNo: '111',
							depositAmount: parseFloat(totalAmount),
							accountNo: policyIsNew
								? policy.bill.payment.accountNo
								: policy.renewals[rIndex].bill.payment.accountNo,
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							collectionStatus: 'COLLECTION',
							sMsDeliveryDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							currencyType: 'BDT',
							currencyRate: 1.0
						}
					],
					secondMrStatusDetails: [
						{
							othersCharge: '0',
							slNo: 1,
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							depositNet: parseFloat(premium),
							depositVat: parseFloat(vat),
							depositNetOthers: 0.0,
							depositStampRec: parseFloat(stampCharge)
						}
					]
				}
			}
		}
	};
	sendBill(receiptOption, user, policy);
}

function prepMotorBill(user, policy) {
	// console.log(policy.renewals);
	// Policy State
	var policyIsNew = true;
	var rIndex = -1;
	if (policy.renewals.length > 0) {
		policyIsNew = false;
		rIndex = policy.renewals.indexOf(
			policy.renewals.find(item => item.bill.billSynced === 0)
		);
		// console.log(rIndex);
		// if (rIndex === 0) {
		// 	oldDocId = policy.doc_id;
		// } else {
		// 	oldDocId = policy.renewals[rIndex-1].doc_id;
		// }
	}

	// App key
	var appKey = {};
	appKey = sAdmin.appKeys.find(function (item) {
		if (policyIsNew) return item.name === policy.appName;
		else return item.name === policy.renewals[rIndex].appName;
	});

	// from policy
	var userProductParams = {};
	policy.productParams.forEach(function (item) {
		userProductParams[item.paramName] = item.paramValue;
	});

	var receiptOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'moneyReceipt',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: policyIsNew
					? policy.bill.payment.receiptNo
					: policy.renewals[rIndex].bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: policyIsNew ? policy.doc_id : policy.renewals[rIndex].doc_id,
						mtId: '0',
						branchCode: policyIsNew
							? policy.doc_id.slice(4, 7)
							: policy.renewals[rIndex].doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						deptCode: 'MSC',
						classCode: policyIsNew
							? policy.doc_id.slice(16, 19)
							: policy.renewals[rIndex].doc_id.slice(16, 19),
						currencyType: 'BDT',
						currencyRate: 1.0,
						netPremium: parseFloat(userProductParams.Net_Premium),
						vatAmount: parseFloat(userProductParams.Vat),
						stampDutyRec: 0.0,
						coInspayable: 0.0,
						grossPremium: parseFloat(userProductParams.Total_Premium),
						stampDutyNon: 0.0,
						docno_all: '',
						remarks: '',
						pcRate: 0.0,
						procurementCost: 0.0,
						refund: 0.0,
						outStandingStatus: '',
						creditStatus: 'YES',
						mrSlNo: '0',
						netOs: '0.00',
						vtOs: '0.00',
						stOs: '0.00',
						lastCreditDate: dateTime.jsToMysql(
							policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt,
							true
						),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: policyIsNew
								? policy.doc_id.slice(4, 7)
								: policy.renewals[rIndex].doc_id.slice(4, 7),
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							mrDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							department: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							mrPremium: parseFloat(userProductParams.Net_Premium),
							mrVat: parseFloat(userProductParams.Vat),
							mrStampDuty: 0.0,
							coInsPayable: 0.0,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							purpose: '',
							classCode: policyIsNew
								? policy.doc_id.slice(16, 19)
								: policy.renewals[rIndex].doc_id.slice(16, 19),
							deptCode: 'MSC',
							activeStatus: 'YES',
							fcType: 'BDT',
							fcRate: 1.0,
							credited: false
						}
					],
					firstMrStatusDetails: [
						{
							slNo: 1,
							payMode: policyIsNew
								? policy.bill.gateway
								: policy.renewals[rIndex].bill.gateway,
							depositDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							depositSlipNo: '111',
							depositAmount: parseFloat(userProductParams.Total_Premium),
							accountNo: policyIsNew
								? policy.bill.payment.accountNo
								: policy.renewals[rIndex].bill.payment.accountNo,
							creditDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							collectionStatus: 'COLLECTION',
							sMsDeliveryDate: dateTime.jsToMysql(
								policyIsNew
									? policy.startsAt
									: policy.renewals[rIndex].startsAt,
								true
							),
							currencyType: 'BDT',
							currencyRate: 1.0
						}
					],
					secondMrStatusDetails: [
						{
							othersCharge: '0',
							slNo: 1,
							docNo: policyIsNew
								? policy.doc_id
								: policy.renewals[rIndex].doc_id,
							depositNet: parseFloat(userProductParams.Net_Premium),
							depositVat: parseFloat(userProductParams.Vat),
							depositNetOthers: 0.0,
							depositStampRec: 0.0
						}
					]
				}
			}
		}
	};
	sendBill(receiptOption, user, policy);
}

function prepTravelBill(user, policy) {
	// App key
	var appKey = {};
	appKey = sAdmin.appKeys.find(function (item) {
		return item.name === policy.appName;
	});

	// from policy
	var userProductParams = {};
	policy.productParams.forEach(function (item) {
		userProductParams[item.paramName] = item.paramValue;
	});

	var receiptOption = {
		method: 'POST',
		uri: gdic.coreAPI.url,
		headers: {
			'Content-Type': 'application/json',
			Authorization: gdic.coreAPI.auth
		},
		json: true, // Automatically stringifies the body to JSON
		body: {
			action: 'create',
			api: 'moneyReceipt',
			timestamp: dateTime.jsToMysql(false, false),
			source: appKey.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: policy.bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: policy.doc_id,
						mtId: '0',
						branchCode: policy.doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(false, true),
						deptCode: 'MSC',
						classCode: policy.doc_id.slice(16, 19),
						currencyType: 'BDT',
						currencyRate: 1.0,
						netPremium: parseFloat(userProductParams.Net_Premium),
						vatAmount: parseFloat(userProductParams.Vat),
						stampDutyRec: parseFloat(userProductParams.Stamp_Duty),
						coInspayable: 0.0,
						grossPremium: parseFloat(userProductParams.Total_Premium),
						stampDutyNon: 0.0,
						docno_all: '',
						remarks: '',
						pcRate: 0.0,
						procurementCost: 0.0,
						refund: 0.0,
						outStandingStatus: '',
						creditStatus: 'YES',
						mrSlNo: '0',
						netOs: '0.00',
						vtOs: '0.00',
						stOs: '0.00',
						lastCreditDate: dateTime.jsToMysql(false, true),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: policy.doc_id.slice(4, 7),
							docNo: policy.doc_id,
							mrDate: dateTime.jsToMysql(false, true),
							department: policy.doc_id.slice(16, 19),
							mrPremium: parseFloat(userProductParams.Net_Premium),
							mrVat: parseFloat(userProductParams.Vat),
							mrStampDuty: parseFloat(userProductParams.Stamp_Duty),
							coInsPayable: 0.0,
							payMode: policy.bill.gateway,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(false, true),
							purpose: '',
							classCode: policy.doc_id.slice(16, 19),
							deptCode: 'MSC',
							activeStatus: 'YES',
							fcType: 'BDT',
							fcRate: 1.0,
							credited: false
						}
					],
					firstMrStatusDetails: [
						{
							slNo: 1,
							payMode: policy.bill.gateway,
							depositDate: dateTime.jsToMysql(false, true),
							depositSlipNo: '111',
							depositAmount: parseFloat(userProductParams.Total_Premium),
							accountNo: policy.bill.payment.accountNo,
							creditDate: dateTime.jsToMysql(false, true),
							collectionStatus: 'COLLECTION',
							sMsDeliveryDate: dateTime.jsToMysql(false, true),
							currencyType: 'BDT',
							currencyRate: 1.0
						}
					],
					secondMrStatusDetails: [
						{
							othersCharge: '0',
							slNo: 1,
							docNo: policy.doc_id,
							depositNet: parseFloat(userProductParams.Net_Premium),
							depositVat: parseFloat(userProductParams.Vat),
							depositNetOthers: 0.0,
							depositStampRec: parseFloat(userProductParams.Stamp_Duty)
						}
					]
				}
			}
		}
	};
	sendBill(receiptOption, user, policy);
}

function sendBill(receiptOption, user, policy) {
	console.log(policy._id + ' - LOG: Initiating money receipt sync');
	// Policy State
	var policyIsNew = true;
	var rIndex = -1;
	if (policy.renewals.length > 0) {
		policyIsNew = false;
		rIndex = policy.renewals.indexOf(
			policy.renewals.find(item => item.bill.billSynced === 0)
		);
	}

	var oldPolicy = Object.assign({}, policy);
	var details = 'Money Receipt synced with GDIC Core';
	var appName = 'NONE';
	var appKey = 'NONE';

	rp(receiptOption)
		.then(function (mrRes) {
			console.log(policy._id + ' - LOG: GDIC Core API responded');
			if (mrRes.replyStatus.result === 'success') {
				console.log(
					policy._id + ' - LOG: GDIC Core API accepted money receipt'
				);
				if (policyIsNew) {
					policy.bill.billSynced = dateTime.now();
				} else {
					policy.renewals[rIndex].bill.billSynced = dateTime.now();
				}
				// Create log
				var newPolicyA = Object.assign({}, policy);
				log
					.create(
						'update',
						details,
						'UserProduct',
						oldPolicy,
						newPolicyA,
						appName,
						appKey,
						'NONE',
						'System'
					)
					.then(
						function (pLog) {
							console.log(policy._id + ' - LOG: System Log created');
							policy.updates.push({
								dateTime: dateTime.now(),
								member_id: 'NONE',
								memberType: 'System',
								log_id: pLog._id
							});
							policy.save(function (err, savedPolicy) {
								if (err) {
									console.log(
										policy._id +
											' - ERROR: Error updating money receipt sync' +
											' status (success)'
									);
									console.log(err);
								} else {
									console.log(
										savedPolicy._id + ' - LOG: Money receipt updated'
									);
									console.log(
										savedPolicy._id + ' - SUCCESS: GDIC Core sync successful'
									);
									if (user.email) {
										// user has added an email address
										console.log(
											savedPolicy._id +
												' - LOG: User has an email address linked'
										);
										// Generate and send policy document to user
										policyDoc.send(user, savedPolicy);
									}
								}
							});
						},
						function (err) {
							console.log(
								policy._id +
									' - ERROR: System Log Failed, Error updating' +
									' policy document sync status (success)'
							);
							console.log(err);
						}
					);
			} else if (
				mrRes.replyStatus.result === 'fail' &&
				mrRes.replyStatus.remarks === 'Money Receipt No. Already Exist'
			) {
				console.log(
					policy._id + ' - LOG: GDIC Core API rejected duplicate mrNo'
				);
				console.log(policy._id + ' - LOG: Resetting mrNo to retry');
				var currentAppName;
				if (policyIsNew) {
					currentAppName = policy.appName;
				} else {
					currentAppName = policy.renewals[rIndex].appName;
				}
				incremental.getMrNo(currentAppName).then(
					function (newMrNo) {
						if (policyIsNew) {
							policy.bill.payment.receiptNo = newMrNo;
						} else {
							policy.renewals[rIndex].bill.payment.receiptNo = newMrNo;
						}
						// Create log
						var newPolicyB = Object.assign({}, policy);
						details = 'Reset mrNo since GDIC CORE API declared as duplicate';
						log
							.create(
								'update',
								details,
								'UserProduct',
								oldPolicy,
								newPolicyB,
								appName,
								appKey,
								'NONE',
								'System'
							)
							.then(
								function (pLog) {
									console.log(policy._id + ' - LOG: System Log created');
									policy.updates.push({
										dateTime: dateTime.now(),
										member_id: 'NONE',
										memberType: 'System',
										log_id: pLog._id
									});
									policy.save(function (err, savedPolicy) {
										if (err) {
											console.log(
												policy._id +
													' - ERROR: Error resetting mrNo' +
													' (success)'
											);
											console.log(err);
										} else {
											console.log(
												savedPolicy._id +
													' - LOG: Money receipt mrNo has been reset'
											);
											console.log(
												savedPolicy._id + ' - LOG: GDIC Core sync retrying'
											);
											// update receipt
											receiptOption.body.request.mrNo = newMrNo;
											sendBill(receiptOption, user, savedPolicy);
										}
									});
								},
								function (err) {
									console.log(
										policy._id +
											' - ERROR: System Log Failed, Error updating' +
											' policy document sync status (success)'
									);
									console.log(err);
								}
							);
					},
					function (err) {
						console.log(
							policy._id +
								' - ERROR: Error generating' +
								' money receipt No, DB FAILURE'
						);
						console.log(err);
					}
				);
			} else {
				console.log(policy._id + ' - ERROR: GDIC Core rejected money receipt');
				console.log(mrRes);
			}
		})
		.catch(function (err) {
			console.log(
				policy._id +
					' - ERROR: Error sending' +
					' money receipt, GDIC CORE API FAILURE'
			);
			console.log(err);
		});
}
/* eslint-enable no-console */

module.exports = {
	syncPolicy: syncPolicy,
	syncBill: syncBill
};
