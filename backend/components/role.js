function hasAccess(admin, collection, access) {
	if (!admin) {
		return true;
	}
	if (access === 'rw') {
		if (
			admin.roles.filter(function (item) {
				return item.collectionName === collection && item.access === access;
			})[0]
		)
			return true;
		return false;
	} else {
		if (
			admin.roles.filter(function (item) {
				return (
					item.collectionName === collection &&
					(item.access === access || item.access === 'rw')
				);
			})[0]
		)
			return true;
		return false;
	}
}

module.exports = {
	hasAccess: hasAccess
};
