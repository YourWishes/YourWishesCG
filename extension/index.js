'use strict';
let nodecg;
const app = require('express')();
const fs = require('fs');

module.exports = function (extensionApi) {
    nodecg = extensionApi;
    
    nodecg.getQueryVariable = function(name, url) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    
    if (typeof String.prototype.replaceAll === typeof undefined) {
        String.prototype.replaceAll = function (search, replacement) {
            var target = this;
            return target.replace(new RegExp(search, 'g'), replacement);
        };
    }
    
    nodecg.cloneObject = function(obj) {
        let cloned = {};
        let keys = Object.keys(obj);
        let i = keys.length;
        while(i--) {
            cloned[keys[i]] = obj[keys[i]];
        }
        return cloned;
    };
    
    
    if (!fs.existsSync('./yourwishescg')){
        fs.mkdirSync('./yourwishescg');
    }
    
    require('./twitch.js')(nodecg,app);
    require('./youtube.js')(nodecg,app);
    require('./music.js')(nodecg,app);
    require('./alerts.js')(nodecg,app);
    require('./bot.js')(nodecg,app);
    
    nodecg.mount(app);
};