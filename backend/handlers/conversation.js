/* eslint-disable no-console */
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var dateTime = require('./../components/dateTime');
var log = require('./../components/log');
var notification = require('./../components/notification');

// Models
var User = mongoose.model('User');
var Conversation = mongoose.model('Conversation');

module.exports = function(io, socket) {

	const onUserSentMessage = function(payload) {
		const user = socket.decoded.user;
		const dateTimeNow = dateTime.now();
		const responseEvent = 'CONVERSATION.MESSAGE.SEND.RES';
		const emitEvent = 'CONVERSATION.MESSAGE.RECEIVED';

		// validation
		if (!payload.conversation_id) {
			return socket.emit(responseEvent, {
				state: 'failure',
				message: 'Conversation ID is required'
			});
		}
		if (!payload.message || payload.message.length === 0) {
			return socket.emit(responseEvent, {
				state: 'failure',
				message: 'Message is required'
			});
		}
		// Bring out the conversation
		Conversation.findOne({
			'_id': mongoose.Types.ObjectId(payload.conversation_id),
			'user_ids': {
				$in: [user._id]
			}
		}, function(err, conversation) {
			if (err) {
				return socket.emit(responseEvent, {
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!conversation) {
				return socket.emit(responseEvent, {
					state: 'failure',
					message: 'Conversation not found'
				});
			}
			if (!conversation.match_id) {
				return socket.emit(responseEvent, {
					state: 'failure',
					message: 'Conversation is inactive'
				});
			}
			const receiver_id = conversation.user_ids.indexOf(user._id.toString())
				=== 0 ? conversation.user_ids[1] : conversation.user_ids[0];
			// Bring out the receiver
			User.findById(receiver_id, function(err, receiver) {
				if (err) {
					return socket.emit(responseEvent, {
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				if (!receiver.active) {
					return socket.emit(responseEvent, {
						state: 'failure',
						message: 'Receiver is inactive'
					});
				}
				var logDetails = `Message sent by user_id: ${user._id}`;
				log.create('update', logDetails, 'Conversation',
					{}, {}, socket.decoded.appKey.name,
					socket.decoded.appKey.token, user._id, 'User')
					.then(function(cLog) {
						conversation.messages.push({
							text: payload.message,
							sent: {
								dateTime: dateTimeNow,
								user_id: user._id,
								log_id: cLog._id
							},
						});
						conversation.updates.push({
							dateTime: dateTimeNow,
							member_id: user._id,
							memberType: 'User',
							log_id: cLog._id
						});
						conversation.save(function(err, sConversation) {
							if (err) {
								return socket.emit(responseEvent, {
									state: 'failure',
									message: 'database error',
									error: err
								});
							}
							// Send live message through socket if user is available
							if (receiver.socketId) {
								io.to(receiver.socketId)
									.emit(emitEvent, {
										state: 'success',
										message: 'Received new message',
										conversation_id: sConversation._id,
										messageObject: sConversation.messages[
											sConversation.messages.length - 1]
									});
							}
							// Send Notification if user is logged in
							if (receiver.notificationToken) {
								notification.send(
									'New Message',
									`${user.profile.nickname} sent you a message`,
									{
										tab: 'chat',
										message: payload.message,
										sender: user.profile.nickname
									},
									receiver.notificationToken
								).then(function() {
									console.log(`Notified ${
										receiver.profile.nickname} about new message`);
								}, function(err) {
									console.error(err);
								});
							}
							return socket.emit(responseEvent, {
								state: 'success',
								message: 'Message sent successfully',
								conversation_id: sConversation._id,
								messageObject: sConversation.messages[
									sConversation.messages.length - 1]
							});
						});
					}, function(err) {
						return socket.emit(responseEvent, {
							state: 'failure',
							message: 'database error',
							error: err
						});
					});
			});
		});
	};

	const onUserConfirmedReception = function(payload) {
		const user = socket.decoded.user;
		const dateTimeNow = dateTime.now();
		const responseEvent = 'CONVERSATION.MESSAGE.RECEIVED.CONFIRM.RES';
		const emitEvent = 'CONVERSATION.MESSAGE.STATUS.RECEIVED';

		// validation
		if (!payload.conversation_id) {
			return socket.emit(responseEvent, {
				state: 'failure',
				message: 'Conversation ID is required'
			});
		}
		if (!payload.message_id) {
			return socket.emit(responseEvent, {
				state: 'failure',
				message: 'Message ID is required'
			});
		}
		// Bring out the conversation
		Conversation.findOne({
			'_id': mongoose.Types.ObjectId(payload.conversation_id),
			'user_ids': {
				$in: [user._id]
			}
		}, function(err, conversation) {
			if (err) {
				return socket.emit(responseEvent, {
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!conversation) {
				return socket.emit(responseEvent, {
					state: 'failure',
					message: 'Conversation not found'
				});
			}
			const receiver_id = conversation.user_ids.indexOf(user._id.toString())
				=== 0 ? conversation.user_ids[1] : conversation.user_ids[0];
			// Bring out the receiver
			User.findById(receiver_id, function(err, receiver) {
				if (err) {
					return socket.emit(responseEvent, {
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				const messageIndex = conversation.messages.indexOf(
					conversation.messages.find(function(item) {
						return item._id.toString() === payload.message_id
							&& item.sent.user_id === receiver_id && !item.receivedAt;
					})
				);
				if (messageIndex < 0) {
					return socket.emit(responseEvent, {
						state: 'failure',
						message: 'Message not found'
					});
				}
				var tempIndex = messageIndex;
				while (tempIndex > -1 && !conversation.messages[tempIndex].receivedAt) {
					conversation.messages[tempIndex].receivedAt = dateTimeNow;
					tempIndex --;
				}
				conversation.save(function(err, sConversation) {
					if (err) {
						return socket.emit(responseEvent, {
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					// Send live status update through socket if user is available
					if (receiver.socketId && receiver.active) {
						io.to(receiver.socketId)
							.emit(emitEvent, {
								state: 'success',
								message: 'Receiver has received your message',
								conversation_id: sConversation._id,
								messageObject: sConversation.messages[messageIndex]
							});
					}
					return socket.emit(responseEvent, {
						state: 'success',
						message: 'Message reception confirmation processed',
						conversation_id: sConversation._id,
						messageObject: sConversation.messages[messageIndex]
					});
				});
			});
		});
	};

	const onUserConfirmedDisplay = function(payload) {
		const user = socket.decoded.user;
		const dateTimeNow = dateTime.now();
		const responseEvent = 'CONVERSATION.MESSAGE.SEEN.CONFIRM.RES';
		const emitEvent = 'CONVERSATION.MESSAGE.STATUS.SEEN';

		// validation
		if (!payload.conversation_id) {
			return socket.emit(responseEvent, {
				state: 'failure',
				message: 'Conversation ID is required'
			});
		}
		if (!payload.message_id) {
			return socket.emit(responseEvent, {
				state: 'failure',
				message: 'Message ID is required'
			});
		}
		// Bring out the conversation
		Conversation.findOne({
			'_id': mongoose.Types.ObjectId(payload.conversation_id),
			'user_ids': {
				$in: [user._id]
			}
		}, function(err, conversation) {
			if (err) {
				return socket.emit(responseEvent, {
					state: 'failure',
					message: 'database error',
					error: err
				});
			}
			if (!conversation) {
				return socket.emit(responseEvent, {
					state: 'failure',
					message: 'Conversation not found'
				});
			}
			const receiver_id = conversation.user_ids.indexOf(user._id.toString())
				=== 0 ? conversation.user_ids[1] : conversation.user_ids[0];
			// Bring out the receiver
			User.findById(receiver_id, function(err, receiver) {
				if (err) {
					return socket.emit(responseEvent, {
						state: 'failure',
						message: 'database error',
						error: err
					});
				}
				const messageIndex = conversation.messages.indexOf(
					conversation.messages.find(function(item) {
						return item._id.toString() === payload.message_id
							&& item.sent.user_id === receiver_id && !item.seenAt;
					})
				);
				if (messageIndex < 0) {
					return socket.emit(responseEvent, {
						state: 'failure',
						message: 'Message not found'
					});
				}
				var tempIndex = messageIndex;
				while (tempIndex > -1 && !conversation.messages[tempIndex].seenAt) {
					conversation.messages[tempIndex].seenAt = dateTimeNow;
					tempIndex --;
				}
				conversation.save(function(err, sConversation) {
					if (err) {
						return socket.emit(responseEvent, {
							state: 'failure',
							message: 'database error',
							error: err
						});
					}
					// Send live status update through socket if user is available
					if (receiver.socketId && receiver.active) {
						io.to(receiver.socketId)
							.emit(emitEvent, {
								state: 'success',
								message: 'Receiver has displayed your message',
								conversation_id: sConversation._id,
								messageObject: sConversation.messages[messageIndex]
							});
					}
					return socket.emit(responseEvent, {
						state: 'success',
						message: 'Message display confirmation processed',
						conversation_id: sConversation._id,
						messageObject: sConversation.messages[messageIndex]
					});
				});
			});
		});
	};

	socket.on('CONVERSATION.MESSAGE.SEND', onUserSentMessage);
	socket.on('CONVERSATION.MESSAGE.RECEIVED.CONFIRM', onUserConfirmedReception);
	socket.on('CONVERSATION.MESSAGE.SEEN.CONFIRM', onUserConfirmedDisplay);
};
