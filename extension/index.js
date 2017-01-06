'use strict';
let nodecg;
const app = require('express')();

module.exports = function (extensionApi) {
    nodecg = extensionApi;
    
    require('./alerts.js')(nodecg,app);
    
    nodecg.mount(app);
};