'use strict';

const TwitchAPI = require('./TwitchAPI.js');
const tmi = require('tmi.js');
const utils = require('../utils/index.js');
const fs = require('fs');

const TOKENS_DIRECTORY = './db/twitch';
const TOKENS_FILE = TOKENS_DIRECTORY+'/tokens.json';

module.exports = class TwitchToken {
    static getTokensFileData() {
        utils.mkdirsSync(TOKENS_DIRECTORY);//Create necessary directories & files
        if(!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, JSON.stringify([]));
        
        //Now Load tokens
        let tokens = JSON.parse(fs.readFileSync(TOKENS_FILE));
        if(!tokens) {
            tokens = [];
            fs.unlinkSync(TOKENS_FILE);
            fs.writeFileSync(TOKENS_FILE, JSON.stringify([]));
        }
        return tokens;
    }
    
    static loadTokens(api) {
        let data = TwitchToken.getTokensFileData();
        let tokens = [];
        for(var i = 0; i < data.length; i++) {
            let token = new TwitchToken(api, data[i].token, data[i].scope);
            token.validate();
            tokens.push(token);
        }
        return tokens;
    }
    
    static writeTokensFileData(data) {
        let x = [];
        for(var i = 0; i < data.length; i++) {
            let j = data[i];
            let h = {};
            h.token = j.token;
            h.scope = j.scope;
            x.push(h);
        }
        
        utils.mkdirsSync(TOKENS_DIRECTORY);//Create necessary directories & files
        if(fs.existsSync(TOKENS_FILE)) fs.unlinkSync(TOKENS_FILE);
        fs.writeFileSync(TOKENS_FILE, JSON.stringify(x));
    }
    
    //Instance
    constructor(api, token, scope) {
        this.api = api;
        this.token = token;
        this.scope = scope;
    }
    
    validate() {
        //We're going to do an async call to see if this token is valid, it will return a channel object.
        this.api.get(this, "/", this.validateCheck);
        console.log("Validating Twitch Token...");
    }
    
    unvalidate() {
        //Removes this token from the api's list of valid tokens
        this.api.unvalidateToken(this);
    }
    
    validateCheck(error, resp, body) {
        //NOTE that "this" will be a request() object
        let token = this.twitch.token;
        
        let invalidToken = function() {
            console.log("Invalid Twitch Token!");
        }
        
        //Valid check
        if(error) {
            invalidToken();
            return;
        }
        
        if(!body) {
            invalidToken();
            return;
        }
        
        let x = JSON.parse(body);
        if(!x) {
            invalidToken();
            return;
        }
        
        if(!x.identified) {
            invalidToken();
            return;
        }
        
        if(!x.token) {
            invalidToken();
            return;
        }
        
        if(!x.token.valid) {
            invalidToken();
            return;
        }
        
        if(x.token.valid != true) {
            invalidToken();
            return;
        }
        
        if(!x.token.authorization || !x.token.authorization.scopes) {
            invalidToken();
            return;
        }
        
        if(!x.token.client_id) {
            invalidToken();
            return;
        }
        
        token.scopes = x.token.authorization.scopes;
        token.user_name = x.token.user_name;
        token.created_at = x.token.authorization.created_at;
        token.updated_at = x.token.authorization.updated_at;
        token.links = x._links;
        
        //Token appears to be valid.
        token.onValidate(x);
    }
    
    createTMI(channels) {
        if(!this.scopes.includes('chat_login')) throw "Does not contain the chat_login scope!";
        let tmiOptions = {
            options: {
                debug: false,
                clientId: this.api.client
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: this.user_name,
                password: "oauth:"+this.token
            },
            channels: channels
        }
        let client = new tmi.client(tmiOptions);
        
        //Injection
        this.api.chatClients.push(client);
        client.twitchToken = this;
        client.channels = channels;
        client.twitchAPI = this.api;
        
        if(typeof client.broadcast === typeof undefined) {
            client.broadcast = function(message) {
                if(!message || typeof message !== typeof "" || message.length < 1) return;
                for(var i = 0; i < this.channels.length; i++) {
                    this.say(this.channels[i], message);
                }
            }
        }
        
        return client;
    }
    
    onValidate(data) {
        //Called when a token has been successfully validated.
        console.log("Twitch token for " + this.user_name + " has been validated!");
        this.api.onTokenValidated(this);
    }
}