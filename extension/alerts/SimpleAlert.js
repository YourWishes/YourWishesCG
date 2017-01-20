'use strict';

//Imports
const Alert = require('./Alert.js');

module.exports = class SimpleAlert extends Alert {
    constructor(options) {
        super(options);
        let x = "";
        let hasImage = false;
        if(this.image) {
            hasImage = true;
            x += '<div class="alert-image"><img src="'+this.image+'" /></div>';
        }
        x += '<div class="alert-title '+(hasImage ? "has-image" : "no-image")+'">';
        x += '<div class="title">'+this.title+'</div>';
        if(this.subtitle) x += '<div class="subtitle">'+this.subtitle+'</div>';
        if(!this.html || this.html == "") this.html = x;
    }
}