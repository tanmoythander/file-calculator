var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var sAdmin = require('./../secrets/superAdmin');

var Incremental = mongoose.model('Incremental');

function getDocId(appName, productCode, productType, docDate = 0) {
	return new Promise(function (resolve, reject) {
		var appKey = sAdmin.appKeys.find(function (item) {
			return item.name === appName;
		});
		if (!appKey) {
			return reject('INVALID APP KEY');
		}

		var date;
		if (docDate > 0) {
			date = new Date(docDate);
		} else {
			date = new Date();
		}
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		if (month < 10) {
			month = '0' + month;
		} else {
			month = '' + month;
		}
		var docId =
			'GDI/' +
			appKey.branchCode.toUpperCase() +
			'/' +
			month +
			'/' +
			year +
			'/' +
			productCode +
			'/' +
			productType +
			'/';
		Incremental.findOne(
			{
				name: 'docId',
				prefixValue: appKey.docIdPrefix,
				year: year,
				branchCode: appKey.branchCode,
				productCode: productCode,
				productType: productType
			},
			function (err, incremental) {
				if (err) {
					return reject(err);
				}
				if (incremental) {
					incremental.value++;
					incremental.save(function (err, sIncremental) {
						if (err) {
							return reject(err);
						}
						return resolve(
							docId +
								appKey.docIdPrefix +
								pad(sIncremental.value, appKey.docIdLenWithOutPrefix)
						);
					});
				} else {
					var newIncremental = new Incremental();
					newIncremental.name = 'docId';
					newIncremental.prefixValue = appKey.docIdPrefix;
					newIncremental.year = year;
					newIncremental.branchCode = appKey.branchCode;
					newIncremental.productCode = productCode;
					newIncremental.productType = productType;
					newIncremental.save(function (err, nIncremental) {
						if (err) {
							return reject(err);
						}
						return resolve(
							docId +
								appKey.docIdPrefix +
								pad(nIncremental.value, appKey.docIdLenWithOutPrefix)
						);
					});
				}
			}
		);
	});
}
function getMrNo(appName) {
	return new Promise(function (resolve, reject) {
		var appKey = sAdmin.appKeys.find(function (item) {
			return item.name === appName;
		});
		if (!appKey) {
			return reject('INVALID APP KEY');
		}

		Incremental.findOne(
			{
				name: 'mrNo',
				prefixValue: appKey.mrNoPrefix
			},
			function (err, incremental) {
				if (err) {
					return reject(err);
				}
				if (incremental) {
					incremental.value++;
					incremental.save(function (err, sIncremental) {
						if (err) {
							return reject(err);
						}
						return resolve(
							appKey.mrNoPrefix +
								pad(sIncremental.value, appKey.mrNoLenWithOutPrefix)
						);
					});
				} else {
					var newIncremental = new Incremental();
					newIncremental.name = 'mrNo';
					newIncremental.prefixValue = appKey.mrNoPrefix;
					newIncremental.save(function (err, nIncremental) {
						if (err) {
							return reject(err);
						}
						return resolve(
							appKey.mrNoPrefix +
								pad(nIncremental.value, appKey.mrNoLenWithOutPrefix)
						);
					});
				}
			}
		);
	});
}

function pad(num, size) {
	var s = num + '';
	while (s.length < size) s = '0' + s;
	return s;
}

module.exports = {
	getDocId: getDocId,
	getMrNo: getMrNo
};
