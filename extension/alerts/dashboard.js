'use strict';

const SimpleAlert = require('./SimpleAlert.js');

module.exports = function(nodecg) {
    nodecg.listenFor('QueueSimpleAlert', function(value, callback) {
        //Makes a basic alert and queues it.
        let alert = new SimpleAlert(value);
        alert.queue();
        
        if(typeof callback == 'function') callback(alert);
    });
}