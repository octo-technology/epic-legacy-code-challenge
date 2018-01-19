var level = require('level');
var config = require('./config');
var path = require('path');

module.exports = level(path.join(__dirname, '../..', 'data', config.name));
