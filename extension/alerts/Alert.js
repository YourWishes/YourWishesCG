'use strict';

//Imports
const fs = require('fs');
const utils = require('../utils/index.js');

//Constants
const ALERTS_DIRECTORY = './db/alerts';

//Replicants
let nodecg = null;
let yw_past_alerts = null;

module.exports = class Alert {
    static setupAlerts(ncg) {
        nodecg = ncg;
        yw_past_alerts = nodecg.Replicant('yw_past_alerts', {defaultValue: [], persistant: true});
        let pastAlerts = [];
        
        utils.mkdirsSync(ALERTS_DIRECTORY);
        
        //Load past alerts, and yes this takes a while as more alerts accumulate
        let files = fs.readdirSync(ALERTS_DIRECTORY);
        for(var i = 0; i < files.length; i++) {
            let file = ALERTS_DIRECTORY + "/" + files[i];
            let jsonRaw = fs.readFileSync(file);
            if(!jsonRaw) continue;
            let json = JSON.parse(jsonRaw);
            if(!json) continue;
            let alert = new Alert(json);
            pastAlerts.push(alert);
        }
        yw_past_alerts.value = pastAlerts;
        
        utils.mkdirsSync(ALERTS_DIRECTORY);
    }
    
    //Instance
    constructor(options) {
        this.position = {
            left: "8px",
            bottom: "8px",
            top: "auto",
            right: "auto"
        };
        this.width = 550;
        this.height = 80;
        this.html = "";
        this.life = 3000;
        this.title = "Custom Alert";
        
        if(options) {
            if(options.position) this.position = options.position;
            if(options.width) this.width = options.width;
            if(options.height) this.height = options.height;
            if(options.html) this.html = options.html;
            if(options.type) this.type = options.type;
            if(options.typeData) this.typeData = options.typeData;
            if(options.id) this.id = options.id;
            if(options.title) this.title = options.title;
            if(options.subtitle) this.subtitle = options.subtitle;
            if(options.life) this.life = options.life;
            if(options.image) this.image = options.image;
            if(options.sound) this.sound = options.sound;
        }
        
        //Now we need to generate an ID
        let extraCrap = 0;
        while(!this.id) {
            let id = new Date().getTime();
            if(fs.existsSync(this.getFile(id))) continue;
            this.id = id;
        }
    }
    
    getFile(id) {
        if(!id) id = this.id;
        return ALERTS_DIRECTORY+"/"+id+".json";
    }
    
    queue() {
        if(!nodecg) return;
        nodecg.sendMessage('ywShowAlert', this);
        if(!this.time) {
            this.time = new Date().getTime();
            this.addToHistory();
        }
    }
    
    addToHistory() {
        if(!yw_past_alerts) return;
        if(typeof yw_past_alerts.value !== typeof []) yw_past_alerts.value = [];
        yw_past_alerts.value.push(this);
        
        let file = this.getFile();
        fs.writeFileSync(file, JSON.stringify(this));
    }
}