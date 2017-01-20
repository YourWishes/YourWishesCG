'use strict';

//Class Imports
const TwitchAuth = require('./auth.js');
const TwitchAPI = require('./TwitchAPI');
const TwitchToken = require('./TwitchToken');

const TOKENS_DIRECTORY = './db/twitch';
const TOKENS_FILE = TOKENS_DIRECTORY+'/tokens.json';

let nodecg;

module.exports = function(extension,app) {
    nodecg = extension;
    
    //Step 1: Setup Auth Handler
    TwitchAuth(nodecg, app);
    
    //Step 2: Validate Config
    if(!nodecg.bundleConfig.twitch || !nodecg.bundleConfig.twitch.client || !nodecg.bundleConfig.twitch.secret || !nodecg.bundleConfig.twitch.redirect) {
        if(nodecg.bundleConfig.twitch) console.error("Twitch configuration invalid, make sure you provide a client id, secret id and redirect URL.");
        return;
    }
    
    //Step 3:  Create & Register our API
    let api = new TwitchAPI(nodecg.bundleConfig.twitch);
    api.register(nodecg,app);
    
    //Step 4: Setup Listeners and Handlers
    require('./bot.js')(api, nodecg);
    require('./follower.js')(api, nodecg);
    require('./dashboard.js')(api, nodecg);
    
    //Step 5: Check for existing Tokens
    TwitchToken.loadTokens(api);
    
};