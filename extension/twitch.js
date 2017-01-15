'use strict';

module.exports = function (nodecg,app) {
    //Imports
    let request = require('request');
    let fs = require('fs');
    let nodeIRC = require('node-irc');
    let tmi = require('tmi.js');
    
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
    let chatClient = undefined;
    
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
                        
                        if(chatClient && chatClient.readyState() == "OPEN") chatClient.disconnect();
                        
                        if(nodecg.bundleConfig.twitch.bot.channel) {
                            console.log("Connecting to Twitch Chat...");
                            //Chat stuff
                            var options = {
                                options: {
                                    debug: false
                                },
                                connection: {
                                    reconnect: true
                                },
                                identity: {
                                    username: bd.token.user_name,
                                    password: "oauth:"+twitch_auth_test.value
                                },
                                channels: ["#"+nodecg.bundleConfig.twitch.bot.channel]
                            };

                            chatClient = new tmi.client(options);

                            // Connect the client to the server..
                            chatClient.connect();
                            chatClient.on("connected", function (address, port) {
                                console.log("Successfully connected to Twitch Chat!");
                                if(nodecg.bundleConfig.twitch.bot.messages && nodecg.bundleConfig.twitch.bot.messages.join) chatClient.say(nodecg.bundleConfig.twitch.bot.channel, nodecg.bundleConfig.twitch.bot.messages.join);
                            });
                            chatClient.on("message", function (channel, userstate, message, self) {
                                // Don't listen to my own messages..
                                if (self || !userstate || !userstate["display-name"]) return;

                                // Handle different message types..
                                switch(userstate["message-type"]) {
                                    case "action":
                                        // This is an action message..
                                        break;
                                    case "chat":
                                        nodecg.ywHandleChat({type:"twitch",handle:chatClient,userstate:userstate}, channel, message, userstate["display-name"]);
                                        break;
                                    case "whisper":
                                        // This is a whisper..
                                        break;
                                    default:
                                        // Something else ?
                                        break;
                                }
                            });
                        }
                        
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
        twitchGET(twitch_auth.value, '/channels/'+nodecg.bundleConfig.twitch.bot.channel+'/follows', function(err,resp,body) {
            if(err) return;
            let follows = JSON.parse(body);
            if(!follows) return;
            if(!follows.follows) return;
            if(follows.follows.length < 1) return;
            
            for(var i = 0; i < follows.follows.length; i++) {
                var followObj = follows.follows[i];
                if(fs.existsSync('./db/twitch/'+nodecg.bundleConfig.twitch.bot.channel+'/followers/'+followObj.user.name+'.json')) continue;
                fs.writeFile('./db/twitch/'+nodecg.bundleConfig.twitch.bot.channel+'/followers/'+followObj.user.name+'.json', JSON.stringify(followObj));
                console.log("Welcome new Twitch follower " + followObj.user.display_name);
                
                if(nodecg.bundleConfig.twitch.alerts && nodecg.bundleConfig.twitch.alerts.follow) {
                    let obj = nodecg.bundleConfig.twitch.alerts.follow;
                    obj = nodecg.cloneObject(obj);
                    
                    if(!obj.title) {
                        obj.title = "New Follower!";
                    } else {
                        let x = obj.title;
                        obj.title = x.replaceAll("{name}", followObj.user.display_name);
                    }
                    
                    if(obj.subtitle) {
                        let x = obj.subtitle
                        obj.subtitle = x.replaceAll("{name}", followObj.user.display_name);
                    }
                    
                    yw_past_alerts.value.push(obj);
                    nodecg.sendMessage('ywShowAlert', obj);
                }
                
                
                if(nodecg.bundleConfig.twitch.bot && nodecg.bundleConfig.twitch.bot.messages && nodecg.bundleConfig.twitch.bot.messages.follow) {
                    chatClient.say(nodecg.bundleConfig.twitch.bot.channel, nodecg.bundleConfig.twitch.bot.messages.follow.replaceAll("{name}", followObj.user.display_name));
                }
            }
        });
    }, 5000);
    
    //Setup
    if(!fs.existsSync('./db')) {
        fs.mkdirSync('./db');
    }
    if (!fs.existsSync('./db/twitch')){
        fs.mkdirSync('./db/twitch');
    }
    
    if(!fs.existsSync('./db/twitch/'+nodecg.bundleConfig.twitch.bot.channel+'/')) {
        fs.mkdirSync('./db/twitch/'+nodecg.bundleConfig.twitch.bot.channel+'/');
    }
    
    if (!fs.existsSync('./db/twitch/'+nodecg.bundleConfig.twitch.bot.channel+'/followers')){
        fs.mkdirSync('./db/twitch/'+nodecg.bundleConfig.twitch.bot.channel+'/followers');
    }
};