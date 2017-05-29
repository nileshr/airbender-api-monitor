const rp = require('request-promise');
const slack = require('./slack');
const moment = require('moment');

const API_URI = "http://52.66.182.145:5000/v1/currentStatus";
const NO_API_REPONSE = "Uh-oh, Looks like the Raspberry Pi is down.";
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || "@nr";

const ALLOWED_HOURS = [3, 5, 7, 9, 11]

const options = {
	uri: API_URI,
	json: true
}

function getAirQualityMessage(index) {
	if (index >= 0 && index <= 100)
		return "smells like roses";
	else if (index >= 101 && index <= 400)
		return "is a bit dusty";
	else if (index >= 401 && index <= 700)
		return "quality index is at harmful levels";
	else
		return "quality is at end of the world levels";	
}

rp(options)
	.then(function (data) {
		if (!!data) {
			let date = new Date();
			let hour = date.getHours();
			let minute = date.getMinutes();
			let airQuality = getAirQualityMessage(data.readingAQ);
			let ts = data.timeStamp.slice(0, 8) + "T" + data.timeStamp.slice(8); // Date and time should be separated with T
			let measureTime = moment(ts).format("h:mm:ss a");
			if (ALLOWED_HOURS.includes(hour) && minute >= 30 && minute <= 39) { // Send message only once a day
				let message = `The current temperature at ${data.name} is ${data.celsius}°C`
				message += `, the humidity is ${data.humidity}% `
				message += `and the air ${airQuality} (${data.readingAQ}ppm).`
				message += `\n Debug Only - Reading taken at ${measureTime}`
				slack.sendMessage(SLACK_CHANNEL, message);
			}
		}
		else {
			slack.sendMessage(SLACK_CHANNEL, NO_API_REPONSE);
		}
	}, function () {
		slack.sendMessage(SLACK_CHANNEL, NO_API_REPONSE);
	});