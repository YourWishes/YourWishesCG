'use strict';

const Alert = require('./Alert.js');
const SimpleAlert = require('./SimpleAlert.js');

module.exports = function (nodecg,app) {
    Alert.setupAlerts(nodecg);
    const dashboard = require('./dashboard.js')(nodecg);
};