const rp = require('request-promise');
const slack = require('./slack')

const API_URI = "http://52.66.182.145:5000/v1/currentStatus";
const NO_API_REPONSE = "Uh-oh, Looks like the Raspberry Pi is down.";
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || "@nr";

const ALLOWED_HOURS = [3, 5, 7, 9, 11]

const options = {
	uri: API_URI,
	json: true
}

rp(options)
	.then(function (data) {
		if (!!data) {
			let date = new Date();
			let hour = date.getHours();
			let minute = date.getMinutes();
			if (ALLOWED_HOURS.includes(hour) && minute >= 30 && minute <= 39) { // Send message only once a day
				let message = `The current temperature at \`${data.name}\` is \`${data.celsius}°C\` `
				message += `, the humidity is \`${data.humidity}%\` `
				message += `and the air quality index is \`${data.readingAQ}ppm\`.`
				slack.sendMessage(SLACK_CHANNEL, message);
			}
		}
		else {
			slack.sendMessage(SLACK_CHANNEL, NO_API_REPONSE);
		}
	}, function () {
		slack.sendMessage(SLACK_CHANNEL, NO_API_REPONSE);
	});