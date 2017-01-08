'use strict';

module.exports = function (nodecg,app) {
    //Imports
    let request = require('request');
    let fs = require('fs');
    
    //Functions
    let twitchGET = function(token, method, callback) {
        request({
            url: "https://api.twitch.tv/kraken"+method,
            method: "GET",
            headers: {
                "Client-ID": nodecg.bundleConfig.twitch.client,
                "Authorization": "OAuth " + token,
                "Accept": "application/vnd.twitchtv.v3+json"
            }
        }, callback);
    }
    
    //First check if we have our config
    if(!nodecg.bundleConfig || !nodecg.bundleConfig.twitch || !nodecg.bundleConfig.twitch.client || !nodecg.bundleConfig.twitch.redirect) {
        console.warn("ERROR: YW Twitch Configuration is invalid, missing either twitch.client and/or twitch.redirect. Twitch will be unavailable.");
    }
    
    if(nodecg.bundleConfig && !nodecg.bundleConfig.channel) {
        console.warn("Missing Twitch channel, some things will not work.");
    }
    
    //Replicants
    const twitch_auth_test = nodecg.Replicant('yw_twitch_auth_test', {defaultValue: null, persistant: true});
    const twitch_auth = nodecg.Replicant('yw_twitch_auth', {defaultValue: null, persistant: false});
    const yw_past_alerts = nodecg.Replicant('yw_past_alerts');
    
    //Replicant Handlers
    twitch_auth_test.on('change', (repl) => {
        twitch_auth.value = undefined;
        if(repl) {
            //Test token
            twitchGET(repl, '/', function(error, resp, body) {
                if(twitch_auth_test.value && !error && body) {
                    let bd = JSON.parse(body);
                    
                    if(bd && bd.token && bd.token.valid) {
                        twitch_auth.value = twitch_auth_test.value;
                        return;
                    }
                }
                twitch_auth_test.value = undefined;
            });
        }
    });
    
    twitch_auth.on('change', (repl) => {
        if(repl) {
            console.log("Twich API now available!");
        } else {
            console.log("Twitch API no longer available.");
        }
    });
    
    //Express Handlers
    app.get('/yourwishescg/twitch-auth', function(req, res) {
        //For some reason that I have no idea why Twitch sends this as an anchor, and express won't read anchor tags.
        res.send('<!DOCTYPE HTML><html lang="en"><head><title></title><meta charset="utf-8" /><script type="text/javascript">window.location.href="/yourwishescg/twitch-auth-set/?"+window.location.hash.substr(1);</script></head><body></body></html>');
    });
    
    app.get('/yourwishescg/twitch-auth-set', function(req, res) {
        if(req.query.access_token && req.query.scope) {
            twitch_auth_test.value = req.query.access_token;
        }
        res.send('<!DOCTYPE HTML><html lang="en"><head><title></title><meta charset="utf-8" /><script type="text/javascript">window.close();</script></head><body></body></html>');
    });
    
    //Timers
    setInterval(() => {
        //Check the people following, any new followers we can make alerts for.
        if(!twitch_auth.value) return;//TwitchAPI not available.
        //https://api.twitch.tv/kraken/channels/test_user1/follows
        twitchGET(twitch_auth.value, '/channels/YourWishes/follows', function(err,resp,body) {
            if(err) return;
            let follows = JSON.parse(body);
            if(!follows) return;
            if(!follows.follows) return;
            if(follows.follows.length < 1) return;
            
            for(var i = 0; i < follows.follows.length; i++) {
                var followObj = follows.follows[i];
                if(fs.existsSync('./db/twitch/followers/'+followObj.user.name+'.json')) continue;
                fs.writeFile('./db/twitch/followers/'+followObj.user.name+'.json', JSON.stringify(followObj));
                console.log("Welcome new Twitch follower " + followObj.user.display_name);
                
                var obj = {
                    title: "New Follower!",
                    subtitle: "Welcome " + followObj.user.display_name + "!",
                    sound: "sounds/ok_lets_do_this.wav",
                    image: "images/heart_animated.gif",
                    life: 10000
                };
                
                yw_past_alerts.value.push(obj);
                nodecg.sendMessage('ywShowAlert', obj);
            }
        });
    }, 30000);
    
    //Setup
    if(!fs.existsSync('./db')) {
        fs.mkdirSync('./db');
    }
    if (!fs.existsSync('./db/twitch')){
        fs.mkdirSync('./db/twitch');
    }
    if (!fs.existsSync('./db/twitch/followers')){
        fs.mkdirSync('./db/twitch/followers');
    }
};