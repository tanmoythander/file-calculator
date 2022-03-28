var multer = require('multer');
var sftpStorage = require('multer-sftp');
var Client = require('ssh2-sftp-client');
var dateTime = require('./dateTime');
var sftpCredential = require('./../secrets/sftp');

// Image file filter
const imageFileFilter = function (req, file, cb) {
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
		cb(null, true);
	} else {
		// reject the file
		cb(null, false);
	}
};

// generate a random string
const randomString = function (chars, length) {
	let generatedString = '';
	for (let i = 0; i < length; i++) {
		generatedString += chars[Math.floor(Math.random() * chars.length)];
	}
	return generatedString;
};

// Item upload config
const profileRemotePath = sftpCredential.basePath + '/img/profile';
const profileStorage = sftpStorage({
	sftp: sftpCredential,
	destination: function (req, file, cb) {
		cb(null, profileRemotePath);
	},
	filename: function (req, file, cb) {
		const digits =
			'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		cb(
			null,
			randomString(digits, 10) +
				'-' +
				dateTime.now() +
				'.' +
				file.originalname.split('.').pop()
		);
	}
});
const uploadProfile = multer({
	storage: profileStorage,
	limits: {
		fileSize: 1024 * 1024 * 5
	},
	fileFilter: imageFileFilter
});
const getProfileBaseUrl = function () {
	return sftpCredential.baseUrl + '/img/profile/';
};

// Delete a file
const deleteFile = function (file) {
	return new Promise(function (resolve, reject) {
		const sftpClient = new Client();
		sftpClient
			.connect(sftpCredential)
			.then(function () {
				return sftpClient.delete(file.destination + '/' + file.filename);
			})
			.then(function (data) {
				sftpClient.end();
				return resolve(data);
			})
			.catch(function (err) {
				sftpClient.end();
				return reject(err);
			});
	});
};

// Delete multiple files
const deleteFiles = function (files) {
	return new Promise(function (resolve, reject) {
		var deletedFiles = [];
		files.forEach(function (file) {
			const sftpClient = new Client();
			sftpClient
				.connect(sftpCredential)
				.then(function () {
					return sftpClient.delete(file.destination + '/' + file.filename);
				})
				.then(function (data) {
					sftpClient.end();
					deletedFiles.push(data);
					if (deletedFiles.length === files.length) {
						return resolve(deletedFiles);
					}
				})
				.catch(function (err) {
					sftpClient.end();
					return reject(err);
				});
		});
	});
};

module.exports = {
	uploadProfile,
	getProfileBaseUrl,
	deleteFile,
	deleteFiles
};
