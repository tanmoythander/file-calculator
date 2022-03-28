var bCrypt = require('bcryptjs');

function create(password) {
	return bCrypt.hashSync(password, bCrypt.genSaltSync(10));
}

function inSync(hash, password) {
	return bCrypt.compareSync(password, hash);
}

module.exports = {
	create,
	inSync
};
