var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var dateTime = require('./../../../components/dateTime');
var role = require('./../../../components/role');
var log = require('./../../../components/log');

// Models
var Banner = mongoose.model('Banner');

function create(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Banner', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	// validation
	if (!req.body.header) {
		return res.status(200).send({
			state: 'failure',
			message: 'Header is required'
		});
	}
	if (!req.body.title) {
		return res.status(200).send({
			state: 'failure',
			message: 'Title is required'
		});
	}
	if (!req.body.description) {
		return res.status(200).send({
			state: 'failure',
			message: 'Description is required'
		});
	}
	if (!req.body.imageURL) {
		return res.status(200).send({
			state: 'failure',
			message: 'Image URL is required'
		});
	}
	if (
		req.body.bannerType &&
		req.body.bannerType !== 'Promotion' &&
		req.body.bannerType !== 'News'
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid banner type'
		});
	}
	if (req.body.expiresAt && dateTime.now() >= req.body.expiresAt) {
		return res.status(200).send({
			state: 'failure',
			message: 'Expiry date must be future date'
		});
	}

	// create new banner
	var newBanner = new Banner();
	newBanner.header = req.body.header;
	newBanner.title = req.body.title;
	newBanner.description = req.body.description;
	newBanner.imageURL = req.body.imageURL;
	newBanner.bannerType = req.body.bannerType ? req.body.bannerType : 'News';
	newBanner.expiresAt = req.body.expiresAt
		? req.body.expiresAt
		: dateTime.today() + 1000 * 60 * 60 * 24 * 365;
	// create log
	var details = 'Created banner';
	var appName = req.decoded.appKey.name;
	var appKey = req.decoded.appKey.token;
	var member_id = req.decoded.admin
		? req.decoded.admin._id
		: req.decoded.superAdmin._id;
	var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
	log
		.create(
			'create',
			details,
			'Banner',
			{},
			newBanner,
			appName,
			appKey,
			member_id,
			memberType
		)
		.then(
			function (bLog) {
				newBanner.created.dateTime = dateTime.now();
				newBanner.created.member_id = member_id;
				newBanner.created.memberType = memberType;
				newBanner.created.log_id = bLog._id;
				newBanner.save(function (err, banner) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					return res.status(200).send({
						state: 'success',
						message: 'Banner created successfully',
						banner: banner
					});
				});
			},
			function (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
		);
}

function getAll(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Banner', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	var query = Banner.find({}, function (err, banners) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		// create log
		var details = `Read all (${banners.length}) banners`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'read',
				details,
				'Banner',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			// eslint-disable-next-line
			.then(
				function () {},
				err => console.err(err)
			);
		return res.status(200).send({
			state: 'success',
			message: 'Returned all banners',
			banners: banners
		});
	});
	query.sort('-created.dateTime');
	assert.ok(query.exec() instanceof require('q').makePromise);
}

function get(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Banner', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Banner.findById(req.params.id, function (err, banner) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!banner) {
			return res.status(200).send({
				state: 'failure',
				message: 'Banner not found'
			});
		}
		// create log
		var details = `Read banner (_id: ${req.params.id})`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'read',
				details,
				'Banner',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			// eslint-disable-next-line
			.then(
				function () {},
				err => console.err(err)
			);
		return res.status(200).send({
			state: 'success',
			message: 'Returned banner',
			banner: banner
		});
	});
}

function update(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Banner', 'r')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	// validation
	if (
		!req.body.header &&
		!req.body.title &&
		!req.body.description &&
		!req.body.imageURL &&
		!req.body.bannerType &&
		!req.body.expiresAt
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Nothing to update'
		});
	}
	if (
		req.body.bannerType &&
		req.body.bannerType !== 'Promotion' &&
		req.body.bannerType !== 'News'
	) {
		return res.status(200).send({
			state: 'failure',
			message: 'Invalid banner type'
		});
	}
	// find out the banner
	Banner.findById(req.params.id, function (err, banner) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!banner) {
			return res.status(200).send({
				state: 'failure',
				message: 'Banner not found'
			});
		}
		var oldDoc = Object.assign({}, banner);
		// update the banner
		if (req.body.header) {
			banner.header = req.body.header;
		}
		if (req.body.title) {
			banner.title = req.body.title;
		}
		if (req.body.description) {
			banner.description = req.body.description;
		}
		if (req.body.imageURL) {
			banner.imageURL = req.body.imageURL;
		}
		if (req.body.bannerType) {
			banner.bannerType = req.body.bannerType;
		}
		if (req.body.expiresAt) {
			banner.expiresAt = req.body.expiresAt;
		}
		// create log
		var newDoc = Object.assign({}, banner);
		var details = 'Updated banner';
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'update',
				details,
				'Banner',
				oldDoc,
				newDoc,
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (bLog) {
					banner.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: bLog._id
					});
					// save the banner
					banner.save(function (err, savedBanner) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Banner updated successfully',
							banner: savedBanner
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function deactivate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Banner', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Banner.findById(req.params.id, function (err, banner) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!banner) {
			return res.status(200).send({
				state: 'failure',
				message: 'Banner not found'
			});
		}
		if (!banner.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Banner is already deactivated',
				banner: banner
			});
		}
		// create log
		var details = `Deactivated banner (_id: ${req.params.id})`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'update',
				details,
				'Banner',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (bLog) {
					banner.active = false;
					banner.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: bLog._id
					});
					banner.save(function (err, savedBanner) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Banner deactivated successfully',
							banner: savedBanner
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

function activate(req, res) {
	// check admin role
	if (!role.hasAccess(req.decoded.admin, 'Banner', 'rw')) {
		return res.status(200).send({
			state: 'failure',
			message: 'Action not permitted'
		});
	}
	Banner.findById(req.params.id, function (err, banner) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!banner) {
			return res.status(200).send({
				state: 'failure',
				message: 'Banner not found'
			});
		}
		if (banner.active) {
			return res.status(200).send({
				state: 'failure',
				message: 'Banner is already activated',
				banner: banner
			});
		}
		// create log
		var details = `Activated banner (_id: ${req.params.id})`;
		var appName = req.decoded.appKey.name;
		var appKey = req.decoded.appKey.token;
		var member_id = req.decoded.admin
			? req.decoded.admin._id
			: req.decoded.superAdmin._id;
		var memberType = req.decoded.admin ? 'Admin' : 'SuperAdmin';
		log
			.create(
				'update',
				details,
				'Banner',
				{},
				{},
				appName,
				appKey,
				member_id,
				memberType
			)
			.then(
				function (bLog) {
					banner.active = true;
					banner.updates.push({
						dateTime: dateTime.now(),
						member_id: member_id,
						memberType: memberType,
						log_id: bLog._id
					});
					banner.save(function (err, savedBanner) {
						if (err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						}
						return res.status(200).send({
							state: 'success',
							message: 'Banner activated successfully',
							banner: savedBanner
						});
					});
				},
				function (err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
			);
	});
}

module.exports = {
	create,
	getAll,
	get,
	update,
	deactivate,
	activate
};
