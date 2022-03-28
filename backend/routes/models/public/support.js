var mailer = require('./../../../components/mailer');
var validate = require('./../../../components/validate');

function contact(req, res) {
	// validation
	if (!req.body.name || req.body.name === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Name is required'
		});
	}
	if (!req.body.replyEmail || req.body.replyEmail === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Reply email is required'
		});
	}
	if (!validate.emailExt(req.body.replyEmail)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Reply email address is invalid'
		});
	}
	if (!req.body.destinationEmail || req.body.destinationEmail === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Destination email is required'
		});
	}
	if (!validate.emailExt(req.body.destinationEmail)) {
		return res.status(200).send({
			state: 'failure',
			message: 'Destination email address is invalid'
		});
	}
	if (!req.body.topic || req.body.topic === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Topic is required'
		});
	}
	if (req.body.topic.length < 2 && req.body.topic.length > 20) {
		return res.status(200).send({
			state: 'failure',
			message: 'Topic length should be between 2 to 20 characters'
		});
	}
	if (!req.body.message || req.body.message === '') {
		return res.status(200).send({
			state: 'failure',
			message: 'Message is required'
		});
	}
	if (req.body.message.length < 10 && req.body.message.length > 500) {
		return res.status(200).send({
			state: 'failure',
			message: 'Message length should be between 10 to 500 characters'
		});
	}

	// build detailed message
	var message = '';
	message += 'Name: ' + req.body.name + '\n';
	message += 'Email: ' + req.body.destinationEmail + '\n';
	message += '\n Message:\n    ' + req.body.message;

	// send mail to responder
	mailer
		.send(
			req.body.destinationEmail,
			req.body.topic + ' (Public)',
			message,
			req.body.replyEmail
		)
		.then(
			function () {
				return res.status(200).send({
					state: 'success',
					message:
						'Your message has been received. We will contact you shortly.'
				});
			},
			err => res.status(500).send(err)
		);
}

module.exports = {
	contact
};
