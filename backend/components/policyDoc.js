var ejs = require('ejs');
var pdf = require('html-pdf');
var dateTime = require('./dateTime');
var mailer = require('./mailer');

var pdfConfig = {
	//'format': 'A4',
	//'orientation': 'portrait',
	width: '1089px',
	height: '1551px',
	phantomArgs: ['--local-url-access=false']
};

async function htmlToPdfBuffer(pathname, params) {
	const html = await ejs.renderFile(pathname, params);
	return new Promise((resolve, reject) => {
		pdf.create(html, pdfConfig).toBuffer((err, buffer) => {
			if (err) {
				reject(err);
			} else {
				resolve(buffer);
			}
		});
	});
}

/* eslint-disable no-console */
async function sendPolicyDoc(user, policy) {
	console.log(policy._id + ' - LOG: Generating policy document');
	var params = {
		user: {},
		policy: {}
	};
	var fileBuffer = undefined;
	var emailHtml = '';
	var sub = '';
	var policyIsNew = true;
	var rIndex = -1;
	if (policy.renewals.length > 0) {
		policyIsNew = false;
		rIndex = policy.renewals.length - 1;
	}

	// prepare user params
	params.user.fullname = user.fullname;
	params.user.mobileNo = user.mobileNo;
	params.user.dob = dateTime.ddmmmyyyy(
		user.profileParams.find(function (item) {
			return item.paramName === 'Date_Of_Birth';
		}).paramValue
	);

	// prepare common policy params
	params.policy.productCode = policy.productCode;
	params.policy.docId = policyIsNew
		? policy.doc_id
		: policy.renewals[rIndex].doc_id;
	params.policy.mrNo = policyIsNew
		? policy.bill.payment.receiptNo
		: policy.renewals[rIndex].bill.payment.receiptNo;
	params.policy.mrDate = dateTime.ddmmmyyyy(dateTime.today());
	params.policy.planName = policy.name.toUpperCase();
	params.policy.startDate = dateTime.ddmmmyyyy(
		policyIsNew ? policy.startsAt : policy.renewals[rIndex].startsAt
	);
	params.policy.endDate = dateTime.ddmmmyyyy(
		policyIsNew ? policy.expiresAt : policy.renewals[rIndex].expiresAt
	);
	params.policy.deliveryAddress = policy.productParams.find(function (item) {
		return item.paramName === 'Delivery_Address';
	}).paramValue;

	if (policy.productCode === 'NIB' || policy.productCode === 'PPA') {
		// prepare other params

		// policy info
		params.policy.sumInsured = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Sum_Insured';
			}).paramValue
		);
		params.policy.nomineeName = policy.productParams.find(function (item) {
			return item.paramName === 'Nominee_Name';
		}).paramValue;
		params.policy.nomineeRelationship = policy.productParams.find(function (
			item
		) {
			return item.paramName === 'Nominee_Relationship';
		}).paramValue;

		// quotation info
		params.policy.netPremium = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Net_Premium';
			}).paramValue
		);
		params.policy.vatRate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Vat_Rate';
			}).paramValue
		);
		params.policy.vat = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Vat';
			}).paramValue
		);
		params.policy.stampDuty = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Stamp_Duty';
			}).paramValue
		);
		params.policy.totalPremium = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Total_Premium';
			}).paramValue
		);

		if (policy.productCode === 'NIB') {
			// prepare Nibedita doc
			fileBuffer = await htmlToPdfBuffer('templates/nib.html', params);
			emailHtml = await ejs.renderFile('templates/policyDocEmail.html', params);
			console.log(policy._id + ' - LOG: Sending Nibedita policy document');
			sub = 'Green Delta Personal Accident Insurance Copy for Nibedita';

			// send policy document
			mailer
				.sendHtmlWithAttachments(user.email, sub, emailHtml, [
					{
						filename: params.policy.docId + '.pdf',
						content: fileBuffer
					},
					{
						filename: 'Policy_Wording_Nibedita.pdf',
						path: 'templates/statics/nib.pdf'
					}
				])
				.then(
					function () {
						console.log(policy._id + ' - SUCCESS: Policy document sent');
					},
					function (err) {
						console.log(policy._id + ' - ERROR: Error sending policy document');
						console.error(err);
					}
				);
		} else {
			// prepare PPA doc
			fileBuffer = await htmlToPdfBuffer('templates/ppa.html', params);
			emailHtml = await ejs.renderFile('templates/policyDocEmail.html', params);
			console.log(policy._id + ' - LOG: Sending PPA policy document');
			sub =
				'Green Delta Personal Accident Insurance' +
				' Copy for People Personal Accident';

			// send policy document
			mailer
				.sendHtmlWithAttachments(user.email, sub, emailHtml, [
					{
						filename: params.policy.docId + '.pdf',
						content: fileBuffer
					},
					{
						filename: 'Policy_Wording_PPA.pdf',
						path: 'templates/statics/ppa.pdf'
					}
				])
				.then(
					function () {
						console.log(policy._id + ' - SUCCESS: Policy document sent');
					},
					function (err) {
						console.log(policy._id + ' - ERROR: Error sending policy document');
						console.error(err);
					}
				);
		}
	} else if (policy.productCode === 'MTR') {
		// prepare other params

		// motor info
		params.policy.seat = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Seat';
			}).paramValue
		);
		params.policy.cc = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'CC';
			}).paramValue
		);
		params.policy.ton = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Ton';
			}).paramValue
		);
		params.policy.vehicleClass = policy.productParams.find(function (item) {
			return item.paramName === 'Vehicle_Class';
		}).paramValue;
		params.policy.vehicleMake = policy.productParams.find(function (item) {
			return item.paramName === 'Vehicle_Make';
		}).paramValue;
		params.policy.makeYear = policy.productParams.find(function (item) {
			return item.paramName === 'Make_Year';
		}).paramValue;
		params.policy.registrationNo = policy.productParams.find(function (item) {
			return item.paramName === 'Registration_No';
		}).paramValue;
		params.policy.engineNo = policy.productParams.find(function (item) {
			return item.paramName === 'Engine_No';
		}).paramValue;
		params.policy.chassisNo = policy.productParams.find(function (item) {
			return item.paramName === 'Chassis_No';
		}).paramValue;

		// quotation info
		params.policy.actLiability = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Act_Liability';
			}).paramValue
		);
		params.policy.driverRate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Driver_Rate';
			}).paramValue
		);
		params.policy.passengerRate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Passenger_Rate';
			}).paramValue
		);
		params.policy.helperRate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Helper_Rate';
			}).paramValue
		);
		params.policy.driver = 1;
		params.policy.passenger = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Passenger';
			}).paramValue
		);
		params.policy.helper = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Helper';
			}).paramValue
		);
		params.policy.driverAmount = params.policy.driverRate;
		params.policy.passengerAmount =
			params.policy.passengerRate * params.policy.passenger;
		params.policy.helperAmount =
			params.policy.helperRate * params.policy.helper;
		params.policy.netPremium = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Net_Premium';
			}).paramValue
		);
		params.policy.vatRate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Vat_Rate';
			}).paramValue
		);
		params.policy.vat = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Vat';
			}).paramValue
		);
		params.policy.totalPremium = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Total_Premium';
			}).paramValue
		);

		// prepare Motor doc
		fileBuffer = await htmlToPdfBuffer('templates/motor.html', params);
		emailHtml = await ejs.renderFile('templates/policyDocEmail.html', params);
		console.log(policy._id + ' - LOG: Sending Motor policy document');
		sub = 'Green Delta Motor Insurance Copy';

		// send policy document
		mailer
			.sendHtmlWithAttachments(user.email, sub, emailHtml, [
				{
					filename: params.policy.docId + '.pdf',
					content: fileBuffer
				},
				{
					filename: 'Policy_Wording_Motor.pdf',
					path: 'templates/statics/motor.pdf'
				}
			])
			.then(
				function () {
					console.log(policy._id + ' - SUCCESS: Policy document sent');
				},
				function (err) {
					console.log(policy._id + ' - ERROR: Error sending policy document');
					console.error(err);
				}
			);
	} else if (policy.productCode === 'B&H') {
		// prepare other params

		// personal info
		// age(years), duration(days), passportNo
		var age =
			(dateTime.today() -
				parseInt(
					user.profileParams.find(function (item) {
						return item.paramName === 'Date_Of_Birth';
					}).paramValue
				)) /
			(1000 * 60 * 60 * 24 * 365.25);
		if (age < 1) {
			params.user.age = age.toFixed(1);
		} else {
			params.user.age = parseInt(age);
		}

		var departureDate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Departure_Date';
			}).paramValue
		);
		var returnDate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Return_Date';
			}).paramValue
		);
		params.policy.departureDate = dateTime.ddmmmyyyy(departureDate);
		params.policy.returnDate = dateTime.ddmmmyyyy(returnDate);
		params.policy.travelDuration =
			(returnDate - departureDate) / (1000 * 60 * 60 * 24);
		params.policy.passportNo = policy.productParams.find(function (item) {
			return item.paramName === 'Passport_No';
		}).paramValue;

		// quotation info
		params.policy.netPremium = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Net_Premium';
			}).paramValue
		);
		params.policy.vatRate = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Vat_Rate';
			}).paramValue
		);
		params.policy.vat = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Vat';
			}).paramValue
		);
		params.policy.stampDuty = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Stamp_Duty';
			}).paramValue
		);
		params.policy.totalPremium = parseInt(
			policy.productParams.find(function (item) {
				return item.paramName === 'Total_Premium';
			}).paramValue
		);

		// prepare Motor doc
		fileBuffer = await htmlToPdfBuffer('templates/omc.html', params);
		emailHtml = await ejs.renderFile('templates/policyDocEmail.html', params);
		console.log(policy._id + ' - LOG: Sending OMC policy document');
		sub = 'Green Delta Overseas Mediclaim Insurance Copy';

		// send policy document
		mailer
			.sendHtmlWithAttachments(user.email, sub, emailHtml, [
				{
					filename: params.policy.docId + '.pdf',
					content: fileBuffer
				},
				{
					filename: 'Policy_Wording_OMC.pdf',
					path: 'templates/statics/omc.pdf'
				}
			])
			.then(
				function () {
					console.log(policy._id + ' - SUCCESS: Policy document sent');
				},
				function (err) {
					console.log(policy._id + ' - ERROR: Error sending policy document');
					console.error(err);
				}
			);
	}
}
/* eslint-enable no-console */

module.exports = {
	send: sendPolicyDoc
};
