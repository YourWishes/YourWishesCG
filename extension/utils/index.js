'use strict';

//Imports
const fs = require('fs');

//Class Overrides
if (typeof String.prototype.replaceAll === typeof undefined) {
    String.prototype.replaceAll = function (search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };
}

if(typeof String.prototype.equalsIgnoreCase === typeof undefined) {
    String.prototype.equalsIgnoreCase = function(str) {
        return typeof str === typeof "" && str.length === this.length && this.toLowerCase() == str.toLowerCase();
    }
}

if(typeof Array.prototype.remove === typeof undefined) {
    Array.prototype.remove = function (v) {
        if (this.indexOf(v) != -1) {
            this.splice(this.indexOf(v), 1);
            return true;
        }
        return false;
    }
}

if(typeof Array.prototype.contains === typeof undefined) {
    Array.prototype.contains = function (v) {
        if (this.indexOf(v) != -1) {
            return true;
        }
        return false;
    }
}

if(typeof Array.prototype.clear === typeof undefined) {
    Array.prototype.clear = function () {
        while(this.length > 0) {
            this.splice(0, 1);
        }
    }
}

module.exports = {
    getQueryVariable: function(name, url) {
        name = name.replace(/[\[\]]/g, "\\$&");
        let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    
    cloneObject: function(obj) {
        let cloned = {};
        let keys = Object.keys(obj);
        let i = keys.length;
        while(i--) {
            cloned[keys[i]] = obj[keys[i]];
        }
        return cloned;
    },
    
    getLocation: function(href) {
        let match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
        return match && {
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: match[4],
            pathname: match[5],
            search: match[6],
            hash: match[7]
        }
    },
    
    mkdirsSync: function(dir) {
        //Creates all directories leading up to the specified path
        let split = dir.split('/');
        
        let currentDir = '';
        let currentIndex = 0;
        while(true) {
            if(currentIndex >= split.length) break;
            currentDir = currentDir+split[currentIndex]+'/';
            currentIndex++;
            if(currentDir == './') continue;
            
            if(fs.existsSync(currentDir)) continue;
            fs.mkdirSync(currentDir);
        }
    },
    
    genGUID: function() {
        let S4 = function() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        };
        return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }
}