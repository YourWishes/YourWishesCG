'use strict';

//Imports
const EventEmitter = require('events');
const TwitchToken = require('./TwitchToken.js');
const utils = require('../utils/index.js');

//Constants
const TWITCH_API_LOCATION = "https://api.twitch.tv/kraken";
const HTML_HEADER = '<!DOCTYPE HTML><html lang="en"><head><title></title><meta charset="utf-8" />';
const HTML_FOOTER = '</head><body></body></html>';
const REGISTERED_API = [];

module.exports = class TwitchAPI extends EventEmitter {
    static getByRedirect(url) {
        for(var i = 0; i < REGISTERED_API.length; i++) {
            let x = REGISTERED_API[i];
            if(!x) continue;
            if(!x.redirect) continue;
            
            let redURL = utils.getLocation(x.redirect);
            
            if(url != x.redirect && url != redURL.pathname) continue;
            return x;
        }
        return null;
    }
    
    static getByClient(client) {
        for(var i = 0; i < REGISTERED_API.length; i++) {
            let x = REGISTERED_API[i];
            if(!x) continue;
            if(!x.client) continue;
            if(client != x.client) continue;
            return x;
        }
        return null;
    }
    
    //Instance
    constructor(config, client, secret, redirect) {
        super();
        this.config = config;
        this.client = config.client;
        this.secret = config.secret;
        this.redirect = config.redirect;
        this.tokens = [];
        this.chatClients = [];
    }
    
    getAuthURL(scope) {
        if(typeof scope === typeof undefined) scope = 'channel_editor chat_login';
        let x = TWITCH_API_LOCATION+'/oauth2/authorize?response_type=token&client_id=';
        x += encodeURIComponent(this.client);
        x += '&redirect_uri='+encodeURIComponent(this.redirect);
        x += '&scope='+encodeURIComponent(scope);
        return x;
    }
    
    getChatClient(username) {
        for(var i = 0; i < this.chatClients.length; i++) {
            if(!this.chatClients[i]) continue;
            if(!this.chatClients[i].twitchToken) continue;
            if(!this.chatClients[i].twitchToken.user_name) continue;
            if(typeof this.chatClients[i].twitchToken.user_name !== typeof "") continue;
            if(this.chatClients[i].twitchToken.user_name.equalsIgnoreCase(username)) return this.chatClients[i];
        }
        return null;
    }
    
    register(nodecg, app) {
        let redURL = utils.getLocation(this.redirect);
        app.get(redURL.pathname, (req, res) => {
            //For some reason that I have no idea why Twitch sends this as an anchor, and express won't read anchor tags, so we are going to redirect.
            //We also need to pass the path so that the code knows which TwitchAPI to validate.
            res.send(HTML_HEADER+'<script type="text/javascript">window.location.href="/yourwishescg/twitch-token/?path="+encodeURIComponent(window.location.pathname)+"&"+window.location.hash.substr(1);</script>'+HTML_FOOTER);
        });
        
        REGISTERED_API.push(this);
        
        //Star the task
        this.updateTask = setInterval((that) => {that.update();}, 200, this);
        
        console.log("Twitch API Registered");
        console.log("Auth URL: "+ this.getAuthURL());
    }
    
    unvalidateToken(token) {
        if(this.tokens.contains(token)) {
            this.tokens.remove(token);
            
            let chatClient = this.getChatClient(token.user_name);
            if(chatClient) {
                this.chatClients.remove(chatClient);
                chatClient.disconnect();
            }
            
            TwitchToken.writeTokensFileData(this.tokens);
            this.emit('tokenUnvalidated', token);
        }
    }
    
    deregister() {
        clearInterval(this.updateTask);
        REGISTERED_API.remove(this);
    }
    
    validateToken(rawToken, scope) {
        let token = new TwitchToken(this, rawToken, scope);
        token.validate();
    }
    
    onTokenValidated(token) {
        if(!this.tokens.contains(token)) {
            //Edit 19/01/2017 - Make sure we actually.. NEED this token
            if(!this.config.bots) return;
            let bots = this.config.bots;
            let botMatch = null;
            for(var i = 0; i < bots.length; i++) {
                if(!bots[i].username) continue;
                if(typeof bots[i].username !== typeof "") continue;
                if(!bots[i].username.equalsIgnoreCase(token.user_name)) continue;
                botMatch = bots[i];
                break;
            }
            if(!botMatch) {
                console.log("Validated token does not match any bots...");
                return;
            }
            this.tokens.push(token);
            token.bot = botMatch;
            TwitchToken.writeTokensFileData(this.tokens);
            this.emit('tokenValidated', token);
        }
    }
    
    onTokenUnvalidated(token) {
        this.tokens.remove(token);
        this.emit('tokenUnvalidated', token);
    }
    
    findToken(search) {
        let tokens = this.findTokens(search, 1);
        if(!tokens || tokens.length < 1) return null;
        return tokens[0];
    }
    
    findTokens(search, limit) {
        if(typeof limit === typeof undefined) limit = 99999;
        if(!search) return [];
        let results = [];
        for(var i = 0; i < this.tokens.length; i++) {
            let token = this.tokens[i];
            if(!token) continue;
            
            //Search by username
            if(search.username && token.user_name && typeof search.username === typeof "" && search.username.equalsIgnoreCase(token.user_name)) {
                results.push(token);
            } else {
                continue;
            }
            if(results.length >= limit) break;
        }
        return results;
    }
    
    update() {
        //Do some stuff here
        this.emit('tick');
    }
    
    get(token, method, callback) {
        if(!method.startsWith("/")) method = "/"+method;
        
        let request = require('request');
        
        let x = request({
            url: TWITCH_API_LOCATION+method,
            method: "GET",
            headers: {
                "Client-ID": this.client,
                "Authorization": "OAuth " + token.token,
                "Accept": "application/vnd.twitchtv.v3+json"
            }
        }, callback);
        
        //We need to inject some data
        x.twitch = {
            token: token,
            api: this,
            method: method,
            api_location: TWITCH_API_LOCATION
        }
        
        return x;
    }
}