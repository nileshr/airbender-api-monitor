var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
  name: String,
  timestamp: String,
  notified: Boolean
});

var LastMessage = mongoose.model('LastMessage', Schema);

module.exports = LastMessage;
