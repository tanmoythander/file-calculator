var rp = require('request-promise');

function shortenURL(url) {
	return new Promise((resolve, reject) => {
		var options = {
			method: 'POST',
			// eslint-disable-next-line max-len
			uri: `https://cutt.ly/api/api.php?key=50337a2bba6c14a917aa5f20fbf5c7bce2386&short=${url}`,
			json: true // Automatically stringifies the body to JSON
		};
		rp(options)
			.then(function (response) {
				return resolve(response.url.shortLink);
			})
			.catch(function (err) {
				return reject(err);
			});
	});
}

module.exports = {
	shortenURL: shortenURL
};
