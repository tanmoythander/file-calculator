var dateTime = require('./dateTime');
var rp = require('request-promise');
var gdic = require('./../secrets/gdicSecret');

// var Log = mongoose.model('Log');
function sendNibedita(user, userProduct) {
	// from user
	var address = user.profileParams.filter(function (item) {
		return item.paramName === 'Address';
	})[0].paramValue;
	var nomineeName = user.profileParams.filter(function (item) {
		return item.paramName === 'Nominee_Name';
	})[0].paramValue;
	var nomineeRelationship = user.profileParams.filter(function (item) {
		return item.paramName === 'Nominee_Relationship';
	})[0].paramValue;
	var dob = parseInt(
		user.profileParams.filter(function (item) {
			return item.paramName === 'Date_Of_Birth';
		})[0].paramValue
	);

	// from userProduct
	var premiumRate = userProduct.productParams.filter(function (item) {
		return item.paramName === 'Premium_Rate';
	})[0].paramValue;
	var vatRate = userProduct.productParams.filter(function (item) {
		return item.paramName === 'Vat_Rate';
	})[0].paramValue;
	var premium = userProduct.productParams.filter(function (item) {
		return item.paramName === 'Net_Premium';
	})[0].paramValue;
	var sumInsured = userProduct.productParams.filter(function (item) {
		return item.paramName === 'Sum_Insured';
	})[0].paramValue;
	var vat = userProduct.productParams.filter(function (item) {
		return item.paramName === 'Vat';
	})[0].paramValue;
	var stampCharge = userProduct.productParams.filter(function (item) {
		return item.paramName === 'Stamp_Duty';
	})[0].paramValue;
	var totalAmount = userProduct.productParams.filter(function (item) {
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
			source: gdic.coreAPI.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				docID: userProduct.doc_id,
				personalAccident: {
					customerStatus: 'NEW',
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
					docDate: dateTime.jsToMysql(false, true),
					businessStatus: 'NEW',
					policyStartDate: dateTime.jsToMysql(false, true),
					policyEndDate: dateTime.jsToMysql(
						dateTime.now() + 364 * 24 * 60 * 60 * 1000,
						true
					),
					planName: userProduct.group,
					planType: userProduct.subGroup,
					infoSource: 'Media',
					sourceMedium: '',
					empCodeOrOtherInfo: '',
					totalDays: 365,
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
			source: gdic.coreAPI.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: userProduct.bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: userProduct.doc_id,
						mtId: '0',
						branchCode: userProduct.doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(false, true),
						deptCode: 'MSC',
						classCode: userProduct.doc_id.slice(16, 19),
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
						lastCreditDate: dateTime.jsToMysql(false, true),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: userProduct.doc_id.slice(4, 7),
							docNo: userProduct.doc_id,
							mrDate: dateTime.jsToMysql(false, true),
							department: userProduct.doc_id.slice(16, 19),
							mrPremium: parseFloat(premium),
							mrVat: parseFloat(vat),
							mrStampDuty: parseFloat(stampCharge),
							coInsPayable: 0.0,
							payMode: userProduct.bill.payment.method,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(false, true),
							purpose: '',
							classCode: userProduct.doc_id.slice(16, 19),
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
							payMode: userProduct.bill.payment.method,
							depositDate: dateTime.jsToMysql(false, true),
							depositAmount: parseFloat(totalAmount),
							accountNo: userProduct.bill.payment.accountNo,
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
							docNo: userProduct.doc_id,
							depositNet: parseFloat(totalAmount),
							depositVat: parseFloat(vat),
							depositNetOthers: 0.0,
							depositStampRec: 0.0
						}
					]
				}
			}
		}
	};
	/* eslint-disable no-console */
	rp(docOption)
		.then(function (docResponse) {
			console.log(docResponse);
			if (docResponse.replyStatus.result === 'success') {
				// Delay 30 seconds
				setTimeout(function () {
					rp(receiptOption)
						.then(function (receiptResponse) {
							console.log(receiptResponse);
						})
						.catch(function (err) {
							console.log(err);
						});
				}, 10000);
			}
		})
		.catch(function (err) {
			console.log(err);
		});
	/* eslint-enable no-console */
}
function sendMotor(user, userProduct) {
	// from user
	var address = user.profileParams.filter(function (item) {
		return item.paramName === 'Address';
	})[0].paramValue;
	var dob = parseInt(
		user.profileParams.filter(function (item) {
			return item.paramName === 'Date_Of_Birth';
		})[0].paramValue
	);

	// from userProduct
	var userProductParams = {};
	userProduct.productParams.forEach(function (item) {
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
			source: gdic.coreAPI.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				docID: userProduct.doc_id,
				motor: {
					// User info
					customerStatus: 'NEW',
					name: user.fullname,
					presentAddress: address,
					permanentAddress: address,
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
					businessStatus: 'NEW',
					docDate: dateTime.jsToMysql(false, true),
					planName: 'ActLiability',
					policyStartDate: dateTime.jsToMysql(
						parseInt(userProductParams.Policy_Start_Date),
						true
					),
					policyEndDate: dateTime.jsToMysql(
						parseInt(userProductParams.Policy_End_Date),
						true
					),
					totalDays: 365,
					infoSource: 'Media',
					sourceMedium: '',
					otherInfo: '',
					issuePlace: 'GDIC-KIOSK',
					previousDocID: '',

					// Motor info
					vehicleClass: userProductParams.Vehicle_Class,
					vehicleMake: userProductParams.Vehicle_Make,
					makeYear: userProductParams.Make_Year,
					regMarkNo: userProductParams.Registration_No,
					chessisNo: userProductParams.Chessis_No,
					cubicCapacity: userProductParams.CC,
					engineNo: userProductParams.Engine_No,
					regAuthorityName: '',
					vehicleType: userProductParams.Vehicle_Class,
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
						actBasicRate: 0,
						actBasicAmount: 0,
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
			source: gdic.coreAPI.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: userProduct.bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: userProduct.doc_id,
						mtId: '0',
						branchCode: userProduct.doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(false, true),
						deptCode: 'MSC',
						classCode: userProduct.doc_id.slice(16, 19),
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
						lastCreditDate: dateTime.jsToMysql(false, true),
						mobileNo: user.mobileNo,
						mrSecurity: '0.0',
						activeStatus: ''
					},
					moneyReceipt: [
						{
							othersCharge: 0.0,
							branchCode: userProduct.doc_id.slice(4, 7),
							docNo: userProduct.doc_id,
							mrDate: dateTime.jsToMysql(false, true),
							department: userProduct.doc_id.slice(16, 19),
							mrPremium: parseFloat(userProductParams.Net_Premium),
							mrVat: parseFloat(userProductParams.Vat),
							mrStampDuty: 0.0,
							coInsPayable: 0.0,
							payMode: userProduct.bill.payment.method,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(false, true),
							purpose: '',
							classCode: userProduct.doc_id.slice(16, 19),
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
							payMode: userProduct.bill.payment.method,
							depositDate: dateTime.jsToMysql(false, true),
							depositAmount: parseFloat(userProductParams.Total_Premium),
							accountNo: userProduct.bill.payment.accountNo,
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
							docNo: userProduct.doc_id,
							depositNet: parseFloat(userProductParams.Total_Premium),
							depositVat: parseFloat(userProductParams.Vat),
							depositNetOthers: 0.0,
							depositStampRec: 0.0
						}
					]
				}
			}
		}
	};
	/* eslint-disable no-console */
	rp(docOption)
		.then(function (docResponse) {
			console.log(docResponse);
			if (docResponse.replyStatus.result === 'success') {
				// Delay 30 seconds
				setTimeout(function () {
					rp(receiptOption)
						.then(function (receiptResponse) {
							console.log(receiptResponse);
						})
						.catch(function (err) {
							console.log(err);
						});
				}, 10000);
			}
		})
		.catch(function (err) {
			console.log(err);
		});
	/* eslint-enable no-console */
}
function sendTravel(user, userProduct) {
	// from user
	var address = user.profileParams.filter(function (item) {
		return item.paramName === 'Address';
	})[0].paramValue;
	var dob = parseInt(
		user.profileParams.filter(function (item) {
			return item.paramName === 'Date_Of_Birth';
		})[0].paramValue
	);

	// from userProduct
	var userProductParams = {};
	userProduct.productParams.forEach(function (item) {
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
			source: gdic.coreAPI.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				docID: userProduct.doc_id,
				travel: {
					customerStatus: 'NEW',
					name: user.fullname,
					presentAddress: address,
					permanentAddress: address,
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
					businessStatus: 'NEW',
					departureCountry: userProductParams.Departure_Country,
					departureDateTime: dateTime.jsToMysql(
						parseInt(userProductParams.Departure_Date),
						true
					),
					returnDateTime: dateTime.jsToMysql(
						parseInt(userProductParams.Return_Date),
						true
					),
					planName: userProduct.name,
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
			source: gdic.coreAPI.source,
			asyncReplyFlag: false,
			replyAddress: '',
			messageID: gdic.coreAPI.messageID,
			correlationID: gdic.coreAPI.correlationID,
			request: {
				mrNo: userProduct.bill.payment.receiptNo,
				moneyReceiptInfo: {
					mrStatus: {
						othersCharge: 0.0,
						docNo: userProduct.doc_id,
						mtId: '0',
						branchCode: userProduct.doc_id.slice(4, 7),
						mrDate: dateTime.jsToMysql(false, true),
						deptCode: 'MSC',
						classCode: userProduct.doc_id.slice(16, 19),
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
							branchCode: userProduct.doc_id.slice(4, 7),
							docNo: userProduct.doc_id,
							mrDate: dateTime.jsToMysql(false, true),
							department: userProduct.doc_id.slice(16, 19),
							mrPremium: parseFloat(userProductParams.Net_Premium),
							mrVat: parseFloat(userProductParams.Vat),
							mrStampDuty: parseFloat(userProductParams.Stamp_Duty),
							coInsPayable: 0.0,
							payMode: userProduct.bill.payment.method,
							remarks: '',
							mrType: '0',
							creditDate: dateTime.jsToMysql(false, true),
							purpose: '',
							classCode: userProduct.doc_id.slice(16, 19),
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
							payMode: userProduct.bill.payment.method,
							depositDate: dateTime.jsToMysql(false, true),
							depositAmount: parseFloat(userProductParams.Total_Premium),
							accountNo: userProduct.bill.payment.accountNo,
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
							docNo: userProduct.doc_id,
							depositNet: parseFloat(userProductParams.Total_Premium),
							depositVat: parseFloat(userProductParams.Vat),
							depositNetOthers: 0.0,
							depositStampRec: 0.0
						}
					]
				}
			}
		}
	};
	/* eslint-disable no-console */
	rp(docOption)
		.then(function (docResponse) {
			console.log(docResponse);
			if (docResponse.replyStatus.result === 'success') {
				// Delay 30 seconds
				setTimeout(function () {
					rp(receiptOption)
						.then(function (receiptResponse) {
							console.log(receiptResponse);
						})
						.catch(function (err) {
							console.log(err);
						});
				}, 10000);
			}
		})
		.catch(function (err) {
			console.log(err);
		});
	/* eslint-enable no-console */
}

function sendUserProductMR(user, userProduct) {
	if (userProduct.productCode === 'NIB') {
		sendNibedita(user, userProduct);
	} else if (userProduct.productCode === 'PPA') {
		sendNibedita(user, userProduct);
	} else if (userProduct.productCode === 'MTR') {
		sendMotor(user, userProduct);
	} else if (userProduct.productCode === 'B&H') {
		sendTravel(user, userProduct);
	}
}

module.exports = {
	// sendNibedita: sendNibedita,
	sendUserProductMR: sendUserProductMR
};
