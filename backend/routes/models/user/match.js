var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var dateTime = require('./../../../components/dateTime');
var log = require('./../../../components/log');
var shuffle = require('./../../../components/shuffle');
var parse = require('./../../../components/parse');
var activity = require('./../../../components/activity');
var notification = require('./../../../components/notification');
var butterflySecret = require('./../../../secrets/butterfly');

var User = mongoose.model('User');
var Match = mongoose.model('Match');
var Conversation = mongoose.model('Conversation');

function getAll(req, res) {
	const user = req.decoded.user;
	const appName = req.decoded.appKey.name;
	const appKey = req.decoded.appKey.token;

	var matchQuery = Match.find({
		$or: [
			{
				'matchA.user_id': user._id,
				'matchA.status': 'Liked',
				'matchB.status': 'Liked'
			},
			{
				'matchB.user_id': user._id,
				'matchA.status': 'Liked',
				'matchB.status': 'Liked'
			}
		]
	}, function(err, matches) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		partner_ids = [];
		matches.forEach(function(match) {
			const partnerMatch = match.matchA.user_id
				=== user._id.toString() ? 'matchB' : 'matchA';
			partner_ids.push(mongoose.Types.ObjectId(
				match[partnerMatch].user_id));
		});
		var activePartnerQuery = User.find({
			'_id': {
				$in: partner_ids
			},
			'active': true
		}, function(err, activePartners) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			var activeMatches = matches.filter(function(match) {
				const partnerMatch = match.matchA.user_id
					=== user._id.toString() ? 'matchB' : 'matchA';
				return activePartners.find(function(aUser) {
					return match[partnerMatch].user_id === aUser._id.toString();
				});
			});
			const details = `Read all ${activeMatches.length} active matches`;
			log.create('read', details, 'Match', {}, {},
				appName, appKey, user._id, 'User')
				// eslint-disable-next-line no-empty-function
				.then(function() {}, function(err) {
					// eslint-disable-next-line no-console
					console.error(err);
				});
			getMatchingProfiles(user, activeMatches)
				.then(function(matchingProfiles) {
					return res.status(200).send({
						state: 'success',
						message: 'Returned all active matches',
						matches: matchingProfiles
					});
				}, function(err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				});
		});
		assert.ok(activePartnerQuery.exec() instanceof require('q').makePromise);
	});
	assert.ok(matchQuery.exec() instanceof require('q').makePromise);
}

function generate(req, res) {
	const user = req.decoded.user;
	if (/*!user.identity.emailVerified || */user.profile.photos.length === 0) {
		return res.status(200).send({
			state: 'failure',
			message: 'User profile is not complete enough'
		});
	}
	if (!user.profile.active) {
		return res.status(200).send({
			state: 'failure',
			message: 'User profile is deactivated'
		});
	}
	const maxMatchingPerDay = butterflySecret.matches.freeMaxMatchingPerDay;
	const appName = req.decoded.appKey.name;
	const appKey = req.decoded.appKey.token;
	const dateTimeNow = dateTime.now();
	const loadingHistory = {
		$or: [
			{
				'matchA.user_id': user._id,
				'matchA.loaded.dateTime': {
					$gte: dateTime.today()
				}
			},
			{
				'matchB.user_id': user._id,
				'matchB.loaded.dateTime': {
					$gte: dateTime.today()
				}
			}
		]
	};
	const nonLoadedList = {
		'matchB.user_id': user._id,
		'matchB.status': 'Created',
		'matchB.loaded.dateTime': {
			$exists: false
		}
	};
	const matchHistory = {
		$or: [
			{
				'matchA.user_id': user._id
			},
			{
				'matchB.user_id': user._id
			}
		]
	};

	// Find if user loaded matches today already
	var loadedQuery = Match.find(loadingHistory, function(err, loadedMatches) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (loadedMatches.length > 0) {
			getMatchingProfiles(user, shuffle.fisherYates(loadedMatches))
				.then(function(matchingProfiles) {
					return res.status(200).send({
						state: 'success',
						message: 'Returned matches for today',
						matches: matchingProfiles
					});
				}, function(err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				});
		} else {
			// look for not-loaded matches
			var nonLoadedQuery = Match.find(
				nonLoadedList, function(err, nonLoadedMatches) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					var details = 'Loaded pre-generated matches';
					log.create('update', details, 'Match', {}, {},
						appName, appKey, user._id, 'User')
						.then(function(loadingLog) {
							// prepare eligible non-loaded matches for loading
							var limitedMatches = nonLoadedMatches.slice(0, maxMatchingPerDay);
							var userMatches = [];
							const prepareNewMatches = function() {
								// matches required to be generated
								const matchingShorts = maxMatchingPerDay - userMatches.length;

								// Proceed to generate the matches those are short

								// TODO: Based on attractiveness and choosiness data

								// Based on both user's preferences (100%)
								// Find previous history of matching
								var historyQuery = Match.find(matchHistory,
									function(err, pastMatches) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}

										// find out forbidden and conditional users
										var forbiddenIds = userMatches.map(function(currentMatch) {
											return currentMatch.matchA.user_id;
										});
										var conditionalIds = [];
										pastMatches.forEach(function(pastMatch) {
											const partnerMatch = pastMatch.matchA.user_id
												=== user._id.toString() ? 'matchB' : 'matchA';

											// eslint-disable-next-line no-extra-parens
											if ((pastMatch.matchA.status === 'Liked'
												&& pastMatch.matchB.status === 'Liked')
												|| pastMatch.matchA.status === 'Created'
												|| pastMatch.matchA.status === 'Loaded'
												|| pastMatch.matchB.status === 'Created'
												|| pastMatch.matchB.status === 'Loaded') {
												forbiddenIds.push(pastMatch[partnerMatch].user_id);
											} else if (pastMatch.matchA.status === 'Broken'
												|| pastMatch.matchB.status === 'Broken') {
												conditionalIds.push({
													user_id: pastMatch[partnerMatch].user_id,
													autoRepeatAfter: (pastMatch.matchA.status === 'Broken'
														? pastMatch.matchA.broken.dateTime
														: pastMatch.matchB.broken.dateTime)
														+ butterflySecret
															.matches.autoRepeatAfterDays * 24 * 60 * 60 * 1000
												});
											} else {
												conditionalIds.push({
													user_id: pastMatch[partnerMatch].user_id,
													autoRepeatAfter: (pastMatch.matchA.status === 'Disliked'
														? pastMatch.matchA.responded.dateTime
														: pastMatch.matchB.responded.dateTime)
														+ butterflySecret
															.matches.autoRepeatAfterDays * 24 * 60 * 60 * 1000
												});
											}
										});
										conditionalIds.sort(function(a, b) {
											return a.autoRepeatAfter - b.autoRepeatAfter;
										});
										// auto-recycle users
										conditionalIds = conditionalIds.filter(function(item) {
											return item.autoRepeatAfter > dateTimeNow;
										});

										// analyse user
										const ageNow = (dateTimeNow - user.info.dob)
											/ (365.25 * 24 * 60 * 60 * 1000);
										var partnerMaxAge = user.preference.ageMax;
										var partnerMinAge = user.preference.ageMin;
										var partnerPreferredMaxAgeGTE = ageNow;
										var partnerPreferredMinAgeLTE = ageNow;
										if (user.info.gender === 'Male') {
											partnerMaxAge = ageNow > partnerMaxAge
												? ageNow : partnerMaxAge;
											partnerMinAge
												-= butterflySecret.matches.maxMaleAgeFluctuation;
											partnerMinAge = partnerMinAge < 18 ? 18 : partnerMinAge;
											partnerPreferredMaxAgeGTE = partnerPreferredMaxAgeGTE
												- butterflySecret.matches.maxMaleAgeFluctuation
												< 18 ? 18 : partnerPreferredMaxAgeGTE
												- butterflySecret.matches.maxMaleAgeFluctuation;
										} else {
											partnerMinAge = ageNow < partnerMinAge && ageNow >= 21
												? ageNow : partnerMinAge;
											partnerMaxAge
												+= butterflySecret.matches.maxFemaleAgeFluctuation;
											partnerMaxAge = partnerMaxAge > 150 ? 150 : partnerMaxAge;
											partnerPreferredMinAgeLTE = partnerPreferredMinAgeLTE
												+ butterflySecret.matches.maxFemaleAgeFluctuation
												> 150 ? 150 : partnerPreferredMinAgeLTE
												+ butterflySecret.matches.maxFemaleAgeFluctuation;
										}
										const partnerMaxDob = dateTimeNow
											- partnerMinAge * 365.25 * 24 * 60 * 60 * 1000;
										const partnerMinDob = dateTimeNow
											- partnerMaxAge * 365.25 * 24 * 60 * 60 * 1000;

										// Giant Queries
										// Finds out new partners
										const newPartnerList = {
											// fixed fields
											'info.gender': user.info.gender === 'Male'
												? 'Female' : 'Male',
											'info.religion': user.info.religion,

											// conditional fields
											// relationship status
											'profile.relationshipStatus':
												user.preference.relationshipStatuses
													.indexOf('Single') > -1
													&& user.preference.relationshipStatuses
														.length === 1 ? 'Single' : {
														$in: ['Divorced', 'Widowed', 'Single']
													},
											// reverse relationship status
											'preference.relationshipStatuses': {
												$in: user.profile.relationshipStatus === 'Single'
													? ['Single', 'Any'] : ['Divorced', 'Widowed', 'Any']
											},
											// age status
											'info.dob': {
												$lte: partnerMaxDob,
												$gte: partnerMinDob
											},
											// reverse age status
											'preference.ageMax': {
												$gte: partnerPreferredMaxAgeGTE
											},
											'preference.ageMin': {
												$lte: partnerPreferredMinAgeLTE
											},

											// excluded list
											'_id': {
												$nin: [
													// current contacts
													...forbiddenIds.map(function(item) {
														return mongoose.Types.ObjectId(item);
													}),
													// recent matches
													...conditionalIds.map(function(item) {
														return mongoose.Types.ObjectId(item.user_id);
													}),
													// blocked (reverse block is seperated below)
													...user.interaction.blocks.map(function(item) {
														return mongoose.Types.ObjectId(item.user_id);
													})
												]
											},
											// reverse block
											'interaction.blocks.user_id': {
												$nin: [user._id.toString()]
											},
											// active status
											'active': true,
											// profile status
											'profile.active': true,
											'profile.photos': {
												$exists: true,
												$ne: []
											},
											// 'identity.emailVerified': true
										};
										// Finds out mixed partners
										const mixedPartnerList = {
											// fixed fields
											'info.gender': user.info.gender === 'Male'
												? 'Female' : 'Male',
											'info.religion': user.info.religion,

											// conditional fields
											// relationship status
											'profile.relationshipStatus':
												user.preference.relationshipStatuses
													.indexOf('Single') > -1
													&& user.preference.relationshipStatuses
														.length === 1 ? 'Single' : {
														$in: ['Divorced', 'Widowed', 'Single']
													},
											// reverse relationship status
											'preference.relationshipStatuses': {
												$in: user.profile.relationshipStatus === 'Single'
													? ['Single', 'Any'] : ['Divorced', 'Widowed', 'Any']
											},
											// age status
											'info.dob': {
												$lte: partnerMaxDob,
												$gte: partnerMinDob
											},
											// reverse age status
											'preference.ageMax': {
												$gte: partnerPreferredMaxAgeGTE
											},
											'preference.ageMin': {
												$lte: partnerPreferredMinAgeLTE
											},

											// excluded list
											'_id': {
												$nin: [
													// current contacts
													...forbiddenIds.map(function(item) {
														return mongoose.Types.ObjectId(item);
													}),
													// recent matches
													...conditionalIds.slice(
														Math.floor(conditionalIds.length / 2))
														.map(function(item) {
															return mongoose.Types.ObjectId(item.user_id);
														}),
													// blocked (reverse block is seperated below)
													...user.interaction.blocks.map(function(item) {
														return mongoose.Types.ObjectId(item.user_id);
													})
												]
											},
											// reverse block
											'interaction.blocks.user_id': {
												$nin: [user._id.toString()]
											},
											// active status
											'active': true,
											// profile status
											'profile.active': true,
											'profile.photos': {
												$exists: true,
												$ne: []
											},
											// 'identity.emailVerified': true
										};
										// Load new partners
										var newPartnerQuery = User.find(newPartnerList,
											function(err, newPartners) {
												if (err) {
													return res.status(500).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												}
												if (newPartners.length >= matchingShorts) {
													// shuffle and remove extra partners
													const shuffledPartners = shuffle.fisherYates(newPartners)
														.slice(0, matchingShorts);
													generateMatches(user, shuffledPartners,
														dateTimeNow, appKey, appName)
														.then(function(generatedMatches) {
															getMatchingProfiles(user, shuffle.fisherYates(
																[...userMatches, ...generatedMatches]))
																.then(function(matchingProfiles) {
																	return res.status(200).send({
																		state: 'success',
																		message: 'Generated matches for today',
																		matches: matchingProfiles
																	});
																}, function(err) {
																	return res.status(500).send({
																		state: 'failure',
																		message: 'database error',
																		error: err
																	});
																});
														}, function(err) {
															return res.status(500).send({
																state: 'failure',
																message: 'database error',
																error: err
															});
														});
												} else {
													// Load mixed partners
													var mixedPartnerQuery = User.find(mixedPartnerList,
														function(err, mixedPartners) {
															if (err) {
																return res.status(500).send({
																	state: 'failure',
																	message: 'database error',
																	error: err
																});
															}
															// shuffle and remove extra partners
															const shuffledPartners = shuffle
																.fisherYates(mixedPartners)
																.slice(0, matchingShorts);
															generateMatches(user, shuffledPartners,
																dateTimeNow, appKey, appName)
																.then(function(generatedMatches) {
																	getMatchingProfiles(user, shuffle.fisherYates(
																		[...userMatches, ...generatedMatches]))
																		.then(function(matchingProfiles) {
																			return res.status(200).send({
																				state: 'success',
																				message: 'Generated matches for today',
																				matches: matchingProfiles
																			});
																		}, function(err) {
																			return res.status(500).send({
																				state: 'failure',
																				message: 'database error',
																				error: err
																			});
																		});
																}, function(err) {
																	return res.status(500).send({
																		state: 'failure',
																		message: 'database error',
																		error: err
																	});
																});
														});
													mixedPartnerQuery.select('-updates -interaction');
													mixedPartnerQuery.limit(matchingShorts * 3);
													assert.ok(
														mixedPartnerQuery.exec() instanceof require('q')
															.makePromise);
												}
											});
										newPartnerQuery.select('-updates -interaction');
										newPartnerQuery.limit(matchingShorts * 3);
										assert.ok(
											newPartnerQuery.exec() instanceof require('q').makePromise);
									});
								assert.ok(historyQuery.exec() instanceof require('q').makePromise);
							};
							if (limitedMatches.length === 0) {
								prepareNewMatches();
							} else {
								limitedMatches.forEach(function(limitedMatch) {
									limitedMatch.matchB.status = 'Loaded';
									limitedMatch.matchB.loaded.dateTime = dateTimeNow;
									limitedMatch.matchB.loaded.log_id = loadingLog._id;
									limitedMatch.updates.push({
										dateTime: dateTimeNow,
										member_id: user._id,
										memberType: 'User',
										log_id: loadingLog._id
									});
									limitedMatch.save(function(err, savedLimitedMatch) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}
										userMatches.push(savedLimitedMatch);
										if (userMatches.length === limitedMatches.length) {
											// finished preparing eligible non-loaded matches for loading
											if (userMatches.length === maxMatchingPerDay) {
												// no need to generate new matches
												getMatchingProfiles(user, shuffle.fisherYates(userMatches))
													.then(function(matchingProfiles) {
														return res.status(200).send({
															state: 'success',
															message: 'Generated matches for today',
															matches: matchingProfiles
														});
													}, function(err) {
														return res.status(500).send({
															state: 'failure',
															message: 'database error',
															error: err
														});
													});
											} else {
												prepareNewMatches();
											}
										}
									});
								});
							}
						}, function(err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						});
				});
			assert.ok(nonLoadedQuery.exec() instanceof require('q').makePromise);
		}
	});
	assert.ok(loadedQuery.exec() instanceof require('q').makePromise);
}

function generateMatches(user, partners, dateTime, appKey, appName) {
	return new Promise(function(resolve, reject) {
		const details = 'Created and loaded matches';
		log.create('create', details, 'Match', {}, {},
			appName, appKey, user._id, 'User')
			.then(function(creatingLog) {
				var savedMatches = [];
				if (partners.length === 0) {
					return resolve(savedMatches);
				}
				partners.forEach(function(partner) {
					var userMatchPercentage = 10;
					var partnerMatchPercentage = 10;

					// Age match comparison (15%)
					const userAge = (user.info.dob - dateTime)
						/ (365.25 * 24 * 60 * 60 * 1000);
					const partnerAge = (partner.info.dob - dateTime)
						/ (365.25 * 24 * 60 * 60 * 1000);
					if (partnerAge >= user.preference.ageMin
						&& partnerAge <= user.preference.ageMax) {
						userMatchPercentage += 15;
					}
					if (userAge >= partner.preference.ageMin
						&& userAge <= partner.preference.ageMax) {
						partnerMatchPercentage += 15;
					}

					// Relationship status comparison (20%)
					if (user.preference.relationshipStatuses.indexOf('Any') > -1
						|| user.preference.relationshipStatuses.indexOf(
							partner.profile.relationshipStatus) > -1) {
						userMatchPercentage += 20;
					}
					if (partner.preference.relationshipStatuses.indexOf('Any') > -1
						|| partner.preference.relationshipStatuses.indexOf(
							user.profile.relationshipStatus) > -1) {
						partnerMatchPercentage += 20;
					}

					// Height comparison (20%)
					if (partner.profile.height >= user.preference.heightMin
						&& partner.profile.height <= user.preference.heightMax) {
						userMatchPercentage += 20;
					}
					if (user.profile.height >= partner.preference.heightMin
						&& user.profile.height <= partner.preference.heightMax) {
						partnerMatchPercentage += 20;
					}

					// Weight comparison (15%)
					if (partner.profile.weight >= user.preference.weightMin
						&& partner.profile.weight <= user.preference.weightMax) {
						userMatchPercentage += 15;
					}
					if (user.profile.weight >= partner.preference.weightMin
						&& user.profile.weight <= partner.preference.weightMax) {
						partnerMatchPercentage += 15;
					}

					// District comparison (15%)
					if (user.preference.districts.indexOf('Any') > -1
						|| user.preference.districts.indexOf(
							partner.profile.district) > -1) {
						userMatchPercentage += 15;
					}
					if (partner.preference.districts.indexOf('Any') > -1
						|| partner.preference.districts.indexOf(
							user.profile.district) > -1) {
						partnerMatchPercentage += 15;
					}

					// Nationality comparison (5%)
					if (user.preference.nationalities.indexOf('Any') > -1
						|| user.preference.nationalities.indexOf(
							partner.profile.nationality) > -1) {
						userMatchPercentage += 5;
					}
					if (partner.preference.nationalities.indexOf('Any') > -1
						|| partner.preference.nationalities.indexOf(
							user.profile.nationality) > -1) {
						partnerMatchPercentage += 5;
					}

					var newMatch = new Match();
					newMatch.matchA.user_id = user._id;
					newMatch.matchA.status = 'Loaded';
					newMatch.matchA.matchPercentage = userMatchPercentage;
					newMatch.matchA.loaded.dateTime = dateTime;
					newMatch.matchA.loaded.log_id = creatingLog._id;
					newMatch.matchB.user_id = partner._id;
					newMatch.matchB.status = 'Created';
					newMatch.matchB.matchPercentage = partnerMatchPercentage;
					newMatch.created.dateTime = dateTime;
					newMatch.created.member_id = user._id;
					newMatch.created.memberType = 'User';
					newMatch.created.log_id = creatingLog._id;
					newMatch.save(function(err, savedMatch) {
						if (err) {
							return reject(err);
						}
						savedMatches.push(savedMatch);
						if (savedMatches.length === partners.length) {
							return resolve(savedMatches);
						}
					});
				});
			}, function(err) {
				return reject(err);
			});
	});
}

function getMatchingProfiles(user, matches) {
	return new Promise(function(resolve, reject) {
		if (matches.length === 0) {
			return resolve([]);
		}
		User.find({
			'_id': {
				$in: matches.map(function(match) {
					return mongoose.Types.ObjectId(
						user._id.toString() === match.matchA.user_id
							? match.matchB.user_id : match.matchA.user_id);
				})
			}
		}, function(err, profiles) {
			if (err) {
				return reject(err);
			}
			var matchingProfiles = [];
			matches.forEach(function(match) {
				matchingProfiles.push({
					match: match,
					profile: parse.contact(profiles.find(function(profile) {
						return profile._id.toString()
							=== (user._id.toString() === match.matchA.user_id
								? match.matchB.user_id : match.matchA.user_id);
					}))
				});
				if (matchingProfiles.length === matches.length) {
					return resolve(matchingProfiles);
				}
			});
		});
	});
}

function like(req, res) {
	var user = req.decoded.user;
	const appName = req.decoded.appKey.name;
	const appKey = req.decoded.appKey.token;
	const dateTimeNow = dateTime.now();

	// validation
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Match ID is invalid'
		});
	}
	Match.findOne({
		$or: [
			{
				'_id': mongoose.Types.ObjectId(req.params.id),
				'matchA.user_id': user._id
			},
			{
				'_id': mongoose.Types.ObjectId(req.params.id),
				'matchB.user_id': user._id
			}
		]
	}, function(err, match) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!match) {
			return res.status(200).send({
				state: 'failure',
				message: 'Match not found'
			});
		}
		const userMatch = match.matchA.user_id === user._id.toString()
			? 'matchA' : 'matchB';
		const partnerMatch = match.matchA.user_id === user._id.toString()
			? 'matchB' : 'matchA';
		if (!match[userMatch].loaded.dateTime) {
			return res.status(200).send({
				state: 'failure',
				message: 'Match has not been loaded yet'
			});
		} else if (match[userMatch].responded.dateTime) {
			return res.status(200).send({
				state: 'failure',
				message: 'Match has already been responded to'
			});
		}
		User.findById(match[partnerMatch].user_id, function(err, partner) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			var userCopy = Object.assign({}, user)._doc;
			var partnerCopy = Object.assign({}, partner)._doc;
			var matchCopy = Object.assign({}, match)._doc;
			// update the user
			user.interaction.acv = (userCopy.interaction.acv
				* userCopy.interaction.cw - partnerCopy.interaction.aav)
				/ (userCopy.interaction.cw + 1);
			user.interaction.cw = userCopy.interaction.cw + 1;
			// update the partner
			partner.interaction.aav = (partnerCopy.interaction.aav
				* partnerCopy.interaction.aw + userCopy.interaction.acv)
				/ (partnerCopy.interaction.aw + 1);
			partner.interaction.aw = partnerCopy.interaction.aw + 1;
			// update the match
			match[userMatch].status = 'Liked';
			match[userMatch].responded.dateTime = dateTimeNow;
			// user log
			const updatedUser = Object.assign({}, user);
			const userLogDetails = `Liked matched user with user_id, ${
				match[partnerMatch].user_id}`;
			log.create('update', userLogDetails, 'User', userCopy, updatedUser,
				appName, appKey, user._id, 'User')
				.then(function(uLog) {
					user.interaction.likes.push({
						dateTime: dateTimeNow,
						user_id: match[partnerMatch].user_id,
						match_id: match._id,
						log_id: uLog._id
					});
					user.updates.push({
						dateTime: dateTimeNow,
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					// partner log
					const updatedPartner = Object.assign({}, partner);
					const partnerLogDetails = `Liked by matched user with user_id, ${
						user._id}`;
					log.create('update', partnerLogDetails,
						'User', partnerCopy, updatedPartner,
						appName, appKey, user._id, 'User')
						.then(function(pLog) {
							partner.updates.push({
								dateTime: dateTimeNow,
								member_id: user._id,
								memberType: 'User',
								log_id: pLog._id
							});
							// match log
							const updatedMatch = Object.assign({}, match);
							const matchLogDetails = `User with user_id, ${
								user._id} liked user with user_id, ${partner._id}`;
							log.create('update', matchLogDetails,
								'Match', matchCopy, updatedMatch,
								appName, appKey, user._id, 'User')
								.then(function(mLog) {
									match[userMatch].responded.log_id = mLog._id;
									match.updates.push({
										dateTime: dateTimeNow,
										member_id: user._id,
										memberType: 'User',
										log_id: mLog._id
									});
									// save user, partner and match one by one
									user.save(function(err, sUser) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}
										partner.save(function(err, sPartner) {
											if (err) {
												return res.status(500).send({
													state: 'failure',
													message: 'database error',
													error: err
												});
											}
											match.save(function(err, sMatch) {
												if (err) {
													return res.status(500).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												}
												if (sMatch.matchA.status === 'Liked'
													&& sMatch.matchB.status === 'Liked') {
													// Save activity for both users
													activity.save(
														sUser._id.toString(),
														sPartner._id.toString(),
														'match',
														`Matched with ${sPartner.profile.nickname}`,
														mLog._id.toString()
													);
													activity.save(
														sPartner._id.toString(),
														sUser._id.toString(),
														'match',
														`Matched with ${sUser.profile.nickname}`,
														mLog._id.toString()
													);
													// Send notification to both users
													if (sUser.notificationToken) {
														notification.send(
															'It\'s a Match !!!',
															`You have just matched with ${
																sPartner.profile.nickname}. Say hello right now !`,
															{
																tab: 'chat',
																message: `You have just matched with ${
																	sPartner.profile.nickname}. Say hello right now !`
															},
															sUser.notificationToken
														).then(function() {
															// eslint-disable-next-line no-console
															console.log(`Notified ${
																sUser.profile.nickname} about new match`);
														}, function(err) {
															// eslint-disable-next-line no-console
															console.error(err);
														});
													}
													if (sPartner.notificationToken) {
														notification.send(
															'It\'s a Match !!!',
															`You have just matched with ${
																sUser.profile.nickname}. Say hello right now !`,
															{
																tab: 'chat',
																message: `You have just matched with ${
																	sUser.profile.nickname}. Say hello right now !`
															},
															sPartner.notificationToken
														).then(function() {
															// eslint-disable-next-line no-console
															console.log(`Notified ${
																sPartner.profile.nickname} about new match`);
														}, function(err) {
															// eslint-disable-next-line no-console
															console.error(err);
														});
													}
													// Set up messaging
													Conversation.findOne({
														'user_ids': {
															$all: [
																sPartner._id.toString(),
																sUser._id.toString()
															]
														}
													}, function(err, conversation) {
														if (err) {
															return res.status(500).send({
																state: 'failure',
																message: 'database error',
																error: err
															});
														}
														if (conversation) {
															// previous conversation found
															var logDetails =
																`Reactivated messaging by adding match_id: ${
																	sMatch._id}`;
															log.create('update', logDetails,
																'Conversation', {}, {},
																appName, appKey, 'NONE', 'System')
																.then(function(cLog) {
																	conversation.match_id = sMatch._id;
																	conversation.updates.push({
																		dateTime: dateTimeNow,
																		member_id: 'NONE',
																		memberType: 'System',
																		log_id: cLog._id
																	});
																	// eslint-disable-next-line no-unused-vars
																	conversation.save(function(err, sConversation) {
																		if (err) {
																			return res.status(500).send({
																				state: 'failure',
																				message: 'database error',
																				error: err
																			});
																		}
																		return res.status(200).send({
																			state: 'success',
																			message: 'Successfully liked user from match',
																			match: sMatch
																		});
																	});
																}, function(err) {
																	return res.status(500).send({
																		state: 'failure',
																		message: 'database error',
																		error: err
																	});
																});
														} else {
															// create new conversation
															var newConversation = new Conversation();
															newConversation.match_id = sMatch._id;
															newConversation.user_ids = [
																sPartner._id.toString(),
																sUser._id.toString()
															];
															var clogDetails =
																`Activated messaging by adding match_id: ${
																	sMatch._id}`;
															log.create('create', clogDetails, 'Conversation',
																{}, {}, appName, appKey, 'NONE', 'System')
																.then(function(cLog) {
																	newConversation.created.dateTime = dateTimeNow;
																	newConversation.created.member_id = 'NONE';
																	newConversation.created.memberType = 'System';
																	newConversation.created.log_id = cLog._id;
																	// eslint-disable-next-line no-unused-vars
																	newConversation.save(function(err, sConversation) {
																		if (err) {
																			return res.status(500).send({
																				state: 'failure',
																				message: 'database error',
																				error: err
																			});
																		}
																		return res.status(200).send({
																			state: 'success',
																			message: 'Successfully liked user from match',
																			match: sMatch
																		});
																	});
																}, function(err) {
																	return res.status(500).send({
																		state: 'failure',
																		message: 'database error',
																		error: err
																	});
																});
														}
													});
												} else {
													// Send notification for being liked
													if ((sMatch[partnerMatch].status === 'Created'
														|| sMatch[partnerMatch].status === 'Loaded')
														&& sPartner.notificationToken) {
														notification.send(
															'Someone Liked You !',
															`Your next swipes might reveal ${
																sUser.info.gender === 'Male' ? 'him' : 'her'}`,
															{
																tab: 'matching'
															},
															sPartner.notificationToken
														).then(function() {
															// eslint-disable-next-line no-console
															console.log(`Notified ${
																sPartner.profile.nickname} about being liked`);
														}, function(err) {
															// eslint-disable-next-line no-console
															console.error(err);
														});
													}
													return res.status(200).send({
														state: 'success',
														message: 'Successfully liked user from match',
														match: sMatch
													});
												}
											});
										});
									});
								}, function(err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								});
						}, function(err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						});
				}, function(err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				});
		});
	});
}

function dislike(req, res) {
	var user = req.decoded.user;
	const appName = req.decoded.appKey.name;
	const appKey = req.decoded.appKey.token;
	const dateTimeNow = dateTime.now();

	// validation
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Match ID is invalid'
		});
	}
	Match.findOne({
		$or: [
			{
				'_id': mongoose.Types.ObjectId(req.params.id),
				'matchA.user_id': user._id
			},
			{
				'_id': mongoose.Types.ObjectId(req.params.id),
				'matchB.user_id': user._id
			}
		]
	}, function(err, match) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!match) {
			return res.status(200).send({
				state: 'failure',
				message: 'Match not found'
			});
		}
		const userMatch = match.matchA.user_id === user._id.toString()
			? 'matchA' : 'matchB';
		const partnerMatch = match.matchA.user_id === user._id.toString()
			? 'matchB' : 'matchA';
		if (!match[userMatch].loaded.dateTime) {
			return res.status(200).send({
				state: 'failure',
				message: 'Match has not been loaded yet'
			});
		} else if (match[userMatch].responded.dateTime) {
			return res.status(200).send({
				state: 'failure',
				message: 'Match has already been responded to'
			});
		}
		User.findById(match[partnerMatch].user_id, function(err, partner) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			var userCopy = Object.assign({}, user)._doc;
			var partnerCopy = Object.assign({}, partner)._doc;
			var matchCopy = Object.assign({}, match)._doc;
			// update the user
			user.interaction.acv = (userCopy.interaction.acv
				* userCopy.interaction.cw + partnerCopy.interaction.aav)
				/ (userCopy.interaction.cw + 1);
			user.interaction.cw = userCopy.interaction.cw + 1;
			// update the partner
			partner.interaction.aav = (partnerCopy.interaction.aav
				* partnerCopy.interaction.aw - userCopy.interaction.acv)
				/ (partnerCopy.interaction.aw + 1);
			partner.interaction.aw = partnerCopy.interaction.aw + 1;
			// update the match
			match[userMatch].status = 'Disliked';
			match[userMatch].responded.dateTime = dateTimeNow;
			// user log
			const updatedUser = Object.assign({}, user);
			const userLogDetails = `Disliked matched user with user_id, ${
				match[partnerMatch].user_id}`;
			log.create('update', userLogDetails, 'User', userCopy, updatedUser,
				appName, appKey, user._id, 'User')
				.then(function(uLog) {
					user.interaction.dislikes.push({
						dateTime: dateTimeNow,
						user_id: match[partnerMatch].user_id,
						match_id: match._id,
						log_id: uLog._id
					});
					user.updates.push({
						dateTime: dateTimeNow,
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					// partner log
					const updatedPartner = Object.assign({}, partner);
					const partnerLogDetails = `Disliked by matched user with user_id, ${
						user._id}`;
					log.create('update', partnerLogDetails,
						'User', partnerCopy, updatedPartner,
						appName, appKey, user._id, 'User')
						.then(function(pLog) {
							partner.updates.push({
								dateTime: dateTimeNow,
								member_id: user._id,
								memberType: 'User',
								log_id: pLog._id
							});
							// match log
							const updatedMatch = Object.assign({}, match);
							const matchLogDetails = `User with user_id, ${
								user._id} disliked user with user_id, ${partner._id}`;
							log.create('update', matchLogDetails,
								'Match', matchCopy, updatedMatch,
								appName, appKey, user._id, 'User')
								.then(function(mLog) {
									match[userMatch].responded.log_id = mLog._id;
									match.updates.push({
										dateTime: dateTimeNow,
										member_id: user._id,
										memberType: 'User',
										log_id: mLog._id
									});
									// save user, partner and match one by one
									// eslint-disable-next-line no-unused-vars
									user.save(function(err, sUser) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}
										// eslint-disable-next-line no-unused-vars
										partner.save(function(err, sPartner) {
											if (err) {
												return res.status(500).send({
													state: 'failure',
													message: 'database error',
													error: err
												});
											}
											match.save(function(err, sMatch) {
												if (err) {
													return res.status(500).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												}
												return res.status(200).send({
													state: 'success',
													message: 'Successfully disliked user from match',
													match: sMatch
												});
											});
										});
									});
								}, function(err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								});
						}, function(err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						});
				}, function(err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				});
		});
	});
}

function breakMatch(req, res) {
	var user = req.decoded.user;
	const appName = req.decoded.appKey.name;
	const appKey = req.decoded.appKey.token;
	const dateTimeNow = dateTime.now();

	// validation
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Match ID is invalid'
		});
	}
	Match.findOne({
		$or: [
			{
				'_id': mongoose.Types.ObjectId(req.params.id),
				'matchA.user_id': user._id
			},
			{
				'_id': mongoose.Types.ObjectId(req.params.id),
				'matchB.user_id': user._id
			}
		]
	}, function(err, match) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!match) {
			return res.status(200).send({
				state: 'failure',
				message: 'Match not found'
			});
		}
		const userMatch = match.matchA.user_id === user._id.toString()
			? 'matchA' : 'matchB';
		const partnerMatch = match.matchA.user_id === user._id.toString()
			? 'matchB' : 'matchA';
		if (match[userMatch].status !== 'Liked'
			|| match[partnerMatch].status !== 'Liked') {
			return res.status(200).send({
				state: 'failure',
				message: 'Match is not successful yet'
			});
		}
		User.findById(match[partnerMatch].user_id, function(err, partner) {
			if (err) {
				return res.status(500).send({
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			var userCopy = Object.assign({}, user)._doc;
			var partnerCopy = Object.assign({}, partner)._doc;
			var matchCopy = Object.assign({}, match)._doc;
			// update the user
			user.interaction.acv = (userCopy.interaction.acv
				* userCopy.interaction.cw + partnerCopy.interaction.aav)
				/ (userCopy.interaction.cw + 1);
			user.interaction.cw = userCopy.interaction.cw + 1;
			// update the partner
			partner.interaction.aav = (partnerCopy.interaction.aav
				* partnerCopy.interaction.aw - userCopy.interaction.acv)
				/ (partnerCopy.interaction.aw + 1);
			partner.interaction.aw = partnerCopy.interaction.aw + 1;
			// update the match
			match[userMatch].status = 'Broken';
			match[userMatch].broken.dateTime = dateTimeNow;
			if (req.body.reason) {
				match[userMatch].broken.reason = req.body.reason;
			}
			// user log
			const updatedUser = Object.assign({}, user);
			const userLogDetails = `Broken with matched user with user_id, ${
				match[partnerMatch].user_id}`;
			log.create('update', userLogDetails, 'User', userCopy, updatedUser,
				appName, appKey, user._id, 'User')
				.then(function(uLog) {
					user.interaction.brokens.push({
						dateTime: dateTimeNow,
						user_id: match[partnerMatch].user_id,
						match_id: match._id,
						log_id: uLog._id
					});
					user.updates.push({
						dateTime: dateTimeNow,
						member_id: 'SELF',
						memberType: 'User',
						log_id: uLog._id
					});
					// partner log
					const updatedPartner = Object.assign({}, partner);
					const partnerLogDetails = `Broken by matched user with user_id, ${
						user._id}`;
					log.create('update', partnerLogDetails,
						'User', partnerCopy, updatedPartner,
						appName, appKey, user._id, 'User')
						.then(function(pLog) {
							partner.updates.push({
								dateTime: dateTimeNow,
								member_id: user._id,
								memberType: 'User',
								log_id: pLog._id
							});
							// match log
							const updatedMatch = Object.assign({}, match);
							const matchLogDetails = `User with user_id, ${
								user._id} has broken with user with user_id, ${partner._id}`;
							log.create('update', matchLogDetails,
								'Match', matchCopy, updatedMatch,
								appName, appKey, user._id, 'User')
								.then(function(mLog) {
									match[userMatch].broken.log_id = mLog._id;
									match.updates.push({
										dateTime: dateTimeNow,
										member_id: user._id,
										memberType: 'User',
										log_id: mLog._id
									});
									// save user, partner and match one by one
									user.save(function(err, sUser) {
										if (err) {
											return res.status(500).send({
												state: 'failure',
												message: 'database error',
												error: err
											});
										}
										partner.save(function(err, sPartner) {
											if (err) {
												return res.status(500).send({
													state: 'failure',
													message: 'database error',
													error: err
												});
											}
											match.save(function(err, sMatch) {
												if (err) {
													return res.status(500).send({
														state: 'failure',
														message: 'database error',
														error: err
													});
												}
												// Save activity
												activity.save(
													sUser._id.toString(),
													sPartner._id.toString(),
													'unmatch',
													`Unmatched with ${sPartner.profile.nickname}`,
													mLog._id.toString()
												);
												activity.save(
													sPartner._id.toString(),
													sUser._id.toString(),
													'unmatch',
													`Unmatched with ${sUser.profile.nickname}`,
													mLog._id.toString()
												);
												// Stop messaging
												Conversation.findOne({
													'match_id': sMatch._id
												}, function(err, conversation) {
													if (err) {
														return res.status(500).send({
															state: 'failure',
															message: 'database error',
															error: err
														});
													}
													var logDetails =
														`Disabled messaging by removing match_id: ${
															conversation.match_id}`;
													log.create('update', logDetails, 'Conversation',
														{}, {}, appName, appKey, 'NONE', 'System')
														.then(function(cLog) {
															conversation.match_id = undefined;
															conversation.updates.push({
																dateTime: dateTimeNow,
																member_id: 'NONE',
																memberType: 'System',
																log_id: cLog._id
															});
															// eslint-disable-next-line no-unused-vars
															conversation.save(function(err, sConversation) {
																if (err) {
																	return res.status(500).send({
																		state: 'failure',
																		message: 'database error',
																		error: err
																	});
																}
																return res.status(200).send({
																	state: 'success',
																	message: 'Successfully broken with matched user',
																	match: sMatch
																});
															});
														}, function(err) {
															return res.status(500).send({
																state: 'failure',
																message: 'database error',
																error: err
															});
														});
												});
											});
										});
									});
								}, function(err) {
									return res.status(500).send({
										state: 'failure',
										message: 'database error',
										error: err
									});
								});
						}, function(err) {
							return res.status(500).send({
								state: 'failure',
								message: 'database error',
								error: err
							});
						});
				}, function(err) {
					return res.status(500).send({
						state: 'failure',
						message: 'database error',
						error: err
					});
				});
		});
	});
}

module.exports = {
	getAll, generate, like, dislike, breakMatch
};
