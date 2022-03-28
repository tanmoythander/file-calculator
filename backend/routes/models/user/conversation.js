var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var assert = require('assert');
var dateTime = require('./../../../components/dateTime');
var parse = require('./../../../components/parse');
var log = require('./../../../components/log');

var User = mongoose.model('User');
var Conversation = mongoose.model('Conversation');

function getAll(req, res) {
	const user = req.decoded.user;
	const appName = req.decoded.appKey.name;
	const appKey = req.decoded.appKey.token;
	var conversationQuery = Conversation.find({
		'user_ids': {
			$in: [user._id]
		}
	}, {
		'messages': {
			$slice: -1
		},
		'updates': {
			$slice: -1
		},
	}, function(err, conversations) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (conversations.length === 0) {
			return res.status(200).send({
				state: 'success',
				message: 'Returned all conversation',
				conversations: []
			});
		}
		// conversations.sort(function (a, b) {
		// 	const dateTimeA = a.updates.length > 0
		// 		? a.updates[0].dateTime : a.created.dateTime;
		// 	const dateTimeB = b.updates.length > 0
		// 		? b.updates[0].dateTime : b.created.dateTime;
		// 	return dateTimeB - dateTimeA;
		// });
		var contactConversations = [];
		conversations.forEach(function(conversation) {
			User.findById(
				conversation.user_ids.indexOf(user._id.toString()) === 0
					? conversation.user_ids[1]
					: conversation.user_ids[0], function(err, contact) {
					if (err) {
						return res.status(500).send({
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					conversation.contact = parse.contact(contact);
					contactConversations.push(conversation);
					if (contactConversations.length === conversations.length) {
						const details = `Read all ${conversations.length} conversations`;
						log.create('read', details, 'Conversation', {}, {},
							appName, appKey, user._id, 'User')
							// eslint-disable-next-line no-empty-function
							.then(function() {}, function(err) {
								// eslint-disable-next-line no-console
								console.error(err);
							});
						return res.status(200).send({
							state: 'success',
							message: 'Returned all conversations',
							conversations: contactConversations
						});
					}
				}).lean();
		});
	}).lean();
	conversationQuery.sort('-created.dateTime');
	assert.ok(conversationQuery.exec() instanceof require('q').makePromise);
}

function getMessages(req, res) {
	const user = req.decoded.user;
	const dateTimeNow = dateTime.now();

	// prepare slice metrics
	const size = !req.body.slice || !req.body.slice.size
		|| isNaN(req.body.slice.size) ? 50
		: req.body.slice.size < 10 ? 10
			: req.body.slice.size > 500
				? 500 : req.body.slice.size;
	const skip = !req.body.slice || !req.body.slice.skip
		|| isNaN(req.body.slice.skip) || req.body.slice.skip
		< 0 ? 0 : req.body.slice.skip;

	Conversation.findOne({
		'_id': mongoose.Types.ObjectId(req.params.id),
		'user_ids': {
			$in: [user._id]
		}
	}, function(err, conversation) {
		if (err) {
			return res.status(500).send({
				state: 'failure',
				message: 'database error',
				error: err
			});
		}
		if (!conversation) {
			return res.status(200).send({
				state: 'failure',
				message: 'Conversation not found'
			});
		}
		var messages = [...conversation.messages];
		messages.reverse();
		var slicedMessages = messages.slice(skip, skip + size);

		// update message status
		var newMessageIds = slicedMessages.filter(function(item) {
			return item.sent.user_id !== user._id.toString() && !item.receivedAt;
		}).map(function(item) {
			return mongoose.Types.ObjectId(item._id.toString());
		});
		if (newMessageIds.length > 0) {
			Conversation.findOneAndUpdate({
				'_id': mongoose.Types.ObjectId(req.params.id),
				'user_ids': {
					$in: [user._id]
				},
				'messages._id': {
					$in: newMessageIds
				}
			}, {
				$set: {
					'messages.$.receivedAt': dateTimeNow
				}
			// eslint-disable-next-line no-unused-vars
			}, function(err, savedConversation) {
				if (err) {
					// eslint-disable-next-line no-console
					console.log('Failed to set message received status');
					// eslint-disable-next-line no-console
					console.log(err);
				}
			});
		}

		res.status(200).send({
			state: 'success',
			message: 'Returned messages from conversation',
			slice: {
				totalMessages: conversation.messages.length,
				size: size,
				skip: skip
			},
			messages: slicedMessages
		});
	});
}

module.exports = {
	getAll, getMessages
};
