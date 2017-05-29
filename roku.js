const rp = require('request-promise');
const slack = require('./slack');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB_URI);

let model = require('./model');

const API_URI = process.env.API_URI || "http://52.66.182.145:5000/v1/currentStatus";
const NO_API_REPONSE = "Uh-oh, Looks like the Raspberry Pi is down.";
const DB_FAIL_CREATE = "Uh-oh, Database Create failed";
const DB_FAIL_UPDATE = "Uh-oh, Database Update failed";

const SLACK_CHANNEL = process.env.SLACK_CHANNEL || "@nr";
const DEVICE_NAME = process.env.DEVICE_NAME || "southbeach";

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

function handleAPIFailure() {
	model.find({ name: DEVICE_NAME }, function (err, res) {
		if (err) {
			slack.sendMessage("@nr", DB_FAIL_GET);
			mongoose.disconnect();
		}
		else {
			data = res[0];
			if (data.notified) {
				console.log("yay! we are done!");
				mongoose.disconnect();
			}				
			else {
				slack.sendMessage(SLACK_CHANNEL, NO_API_REPONSE);
				updateDB(data.timestamp, true);
			}
				
		}
	});
}

function updateDB(ts, notified) {
	model.findOneAndUpdate({ name: DEVICE_NAME }, { name: DEVICE_NAME, timestamp: ts, notified: notified }, function (err, res) {
		if (err) {
			slack.sendMessage("@nr", DB_FAIL_UPDATE);
			mongoose.disconnect();
		}
		if (res == null) {
			newDevice = model({
				name: DEVICE_NAME,
				timestamp: ts,
				notified: notified
			});
			newDevice.save(function (err) {
				if (err) {
					slack.sendMessage("@nr", DB_FAIL_CREATE);
					mongoose.disconnect();
				}
				else {
					mongoose.disconnect();
				}
			});
		}
		else
			mongoose.disconnect();
	});
}

rp(options)
	.then(function (data) {
		if (!!data) {
			let date = new Date();
			let hour = date.getHours();
			let minute = date.getMinutes();
			let airQuality = getAirQualityMessage(data.readingAQ);
			if (ALLOWED_HOURS.includes(hour) && minute >= 30 && minute <= 39) { // Send message only once a day
				let message = `The current temperature at ${data.name} is ${data.celsius}°C`
				message += `, the humidity is ${data.humidity}% `
				message += `and the air ${airQuality} (${data.readingAQ}ppm).`
				slack.sendMessage(SLACK_CHANNEL, message);
			}
			updateDB(data.timeStamp, false);
		}
		else {
			handleAPIFailure();
		}
	}, function () {
		handleAPIFailure();
	});