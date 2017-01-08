'use strict';
let nodecg;
const app = require('express')();
const fs = require('fs');

module.exports = function (extensionApi) {
    nodecg = extensionApi;
    
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    
    if (!fs.existsSync('./yourwishescg')){
        fs.mkdirSync('./yourwishescg');
    }
    
    require('./twitch.js')(nodecg,app);
    require('./music.js')(nodecg,app);
    require('./alerts.js')(nodecg,app);
    
    nodecg.mount(app);
};