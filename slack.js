const Slack = require('slack-node');

const BOT_NAME = "Pi Monitor";
const WEBHOOK_URI = process.env.WEBHOOK_URI;

const slack = new Slack();
slack.setWebhook(WEBHOOK_URI);

const sendMessage = function (channel, message) {
	slack.webhook({
		channel: channel,
		username: BOT_NAME,
		text: message,
		link_names: 1
	}, function (err, response) {
		console.log(response);
	});
}

module.exports.sendMessage = sendMessage;