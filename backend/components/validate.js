const phoneWithCountryCodeRegex = /(^(\+8801){1}[3456789]{1}(\d){8})$/;
// eslint-disable-next-line no-useless-escape
const emailRegex = new RegExp(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/);
// eslint-disable-next-line max-len
const phoneOrEmailRegex = new RegExp(
	phoneWithCountryCodeRegex.source + '|' + emailRegex.source
);
// eslint-disable-next-line
const secureURLRegex = /^https:\/\/?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
// eslint-disable-next-line max-len
// const phoneWithOrWithoutCountryCodeRegex = new RegExp(/(^(\+88)?(01){1}[3456789]{1}(\d){8})$/);
// const phoneWithoutCountryCodeRegex = /(^(01){1}[3456789]{1}(\d){8})$/;

/* eslint-disable no-unused-vars */
function validatePhone(phone, res, next) {
	return phoneWithCountryCodeRegex.test(phone);
}

function validateEmail(email, res, next) {
	return emailRegex.test(email);
}

function validatePhoneOrEmail(phoneOrEmail, res, next) {
	return phoneOrEmailRegex.test(phoneOrEmail);
}

function validateSecureURL(url, res, next) {
	return secureURLRegex.test(url);
}
/* eslint-enable no-unused-vars */

module.exports = {
	phone: [validatePhone, 'Invalid phone number'],
	email: [validateEmail, 'Invalid email address'],
	phoneOrEmail: [validatePhoneOrEmail, 'Invalid id'],
	secureURL: [validateSecureURL, 'Valid https URL is required'],
	phoneExt: obj => validatePhone(obj, false, false),
	emailExt: obj => validateEmail(obj, false, false),
	phoneOrEmailExt: obj => validatePhoneOrEmail(obj, false, false),
	secureURLExt: obj => validateSecureURL(obj, false, false)
};
