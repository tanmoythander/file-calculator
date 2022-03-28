function parseUser(user) {
	// var profileParams = {};
	// user.profileParams.forEach(function(item) {
	// 	profileParams[item.paramName] = item.paramValue;
	// });
	// user.profileParams = undefined;
	// user.profile = profileParams;
	user.identity.password = undefined;
	user.updates = undefined;
	user.notificationToken = undefined;
	user.interaction = undefined;
	// user.identity.emailVerified = undefined;
	user.identity.emailTemp = undefined;
	return user;
}

function parseContact(user) {
	// var profileParams = {};
	// user.profileParams.forEach(function(item) {
	// 	profileParams[item.paramName] = item.paramValue;
	// });
	// user.profileParams = undefined;
	// user.profile = profileParams;
	user.updates = undefined;
	user.notificationToken = undefined;
	// user.socketId = undefined;
	user.interaction = undefined;
	user.identity = undefined;
	return user;
}

function parseAdmin(admin) {
	// var roles = {};
	// admin.roles.forEach(function(item) {
	// 	roles[item.collectionName] = item.access;
	// });
	// admin.roles = roles;
	if (admin.password) {
		admin.password = undefined;
	}
	if (admin.updates && admin.updates.length !== 0) {
		admin.updates = undefined;
	}
	return admin;
}

function parseUserProduct(userProduct) {
	// var productParams = {};
	// userProduct.productParams.forEach(function(item) {
	// 	if (isNaN(parseFloat(item.paramValue))) {
	// 		productParams[item.paramName] = item.paramValue;
	// 	} else {
	// 		productParams[item.paramName] = parseFloat(item.paramValue);
	// 	}
	// });
	// userProduct.productParams = undefined;
	// userProduct.config = productParams;
	return userProduct;
}

// function parsePolicy(userProduct, returnType = 'ALL') {
// 	var seperatedPolicies = [];
// 	var plainPolicyObject = JSON.parse(JSON.stringify(userProduct));
// 	var basePolicy = Object.assign({}, plainPolicyObject);
// 	basePolicy.created = undefined;
// 	basePolicy.updates = undefined;
// 	basePolicy.renewals = undefined;

// 	var primaryPolicy = Object.assign({}, basePolicy);
// 	primaryPolicy.expiresAt = plainPolicyObject.bill.expiresAt;
// 	primaryPolicy.renewalDoc_id = plainPolicyObject.renewals.length > 0
// 		? plainPolicyObject.renewals[0].doc_id : undefined;
// 	seperatedPolicies.push(primaryPolicy);

// 	if (plainPolicyObject.renewals.length > 0) {
// 		plainPolicyObject.renewals.forEach(function(item, index) {
// 			var secondaryPolicy = Object.assign({}, basePolicy);
// 			secondaryPolicy.bill = item.bill;
// 			secondaryPolicy.doc_id = item.doc_id;
// 			secondaryPolicy.docSynced = item.docSynced;
// 			secondaryPolicy.startsAt = item.startsAt;
// 			secondaryPolicy.expiresAt = item.expiresAt;
// 			secondaryPolicy.renewalDoc_id = index + 1 < plainPolicyObject.renewals.length
// 				? plainPolicyObject.renewals[index + 1].doc_id : undefined;
// 			seperatedPolicies.push(secondaryPolicy);
// 		});
// 	}
// 	if (returnType === 'STARTS') {
// 		return seperatedPolicies.slice(0, 1);
// 	} else if (returnType === 'ENDS') {
// 		return seperatedPolicies.slice(
// 			seperatedPolicies.length - 1, seperatedPolicies.length);
// 	} else {
// 		return seperatedPolicies;
// 	}
// }

module.exports = {
	user: parseUser,
	contact: parseContact,
	admin: parseAdmin,
	userProduct: parseUserProduct
	// policy: parsePolicy
};
