'use strict';
let nodecg;
const app = require('express')();
const fs = require('fs');

module.exports = function (extensionApi) {
    nodecg = extensionApi;
    
    if (!fs.existsSync('./yourwishescg')){
        fs.mkdirSync('./yourwishescg');
    }
    
    require('./twitch.js')(nodecg,app);
    require('./alerts.js')(nodecg,app);
    
    nodecg.mount(app);
};