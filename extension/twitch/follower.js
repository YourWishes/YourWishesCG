'use strict';

const utils = require('../utils/index.js');
const fs = require('fs');
const SimpleAlert = require('../alerts/SimpleAlert.js');

module.exports = function(api, nodecg) {
    
    let last_follower_check = 0;
    api.on('tick', function() {
        //No bots, no need to do anything
        if(!nodecg.bundleConfig.twitch.bots) return;
        
        let bots = nodecg.bundleConfig.twitch.bots;
        let now = new Date().getTime();
        
        //5000 = 5 second cooldown
        if(now-last_follower_check > 5000) {
            //Check for followers
            for(var i = 0; i < bots.length; i++) {
                let bot = bots[i];
                if(!bot.channels) continue;
                
                //This bot needs a token
                let token = api.findToken({
                    username: bot.username
                });
                if(!token) continue;
                
                for(var x = 0; x < bot.channels.length; x++) {
                    let channel = bot.channels[x];
                    
                    //First we need to get the recent followers.
                    let request = this.get(token, '/channels/'+channel.replace("#", "")+'/follows', function(err,resp,body) {
                        //Inside this function, the term "this" refers to the request, injected data has been inserted (hopefully)
                        if(err) return;
                        let follows = JSON.parse(body);
                        if(!follows) return;
                        if(!follows.follows) return;
                        if(follows.follows.length < 1) return;
                        
                        let followDir = './db/twitch/'+this.twitch.bot.username.toLowerCase()+'/'+this.twitch.channel.toLowerCase()+'/followers';
                        utils.mkdirsSync(followDir);
                        
                        for(var i = 0; i < follows.follows.length; i++) {
                            var followObj = follows.follows[i];
                            let followFile = followDir + "/" + followObj.user.name.toLowerCase() + ".json";
                            
                            //Already Exists?
                            if(fs.existsSync(followFile)) continue;
                            //New Follower Hype
                            fs.writeFile(followFile, JSON.stringify(followObj));
                            this.twitch.api.emit('userFollow', followObj, this.twitch);
                        }
                    });
                    
                    //We need to inject a little bit of data here
                    request.twitch.bot = bot;
                    request.twitch.channel = channel;
                }
            }
            
            //Reset Cooldown
            last_follower_check = now;
        }
    });
    
    api.on('userFollow', function(followData, twitchObject) {
        //Log before we do fancy stuff
        let x = followData.user.name + " has started following " + twitchObject.channel;
        if(followData.notifications && followData.notifications === true) x += " (with notifications)";
        console.log(x);
        
        let chatClient = twitchObject.api.getChatClient(twitchObject.bot.username);
        if(!chatClient) return;
        
        let channelName = twitchObject.channel.replace("#", "");
        let channel = "#"+channelName
        
        //Alright, now let's see if we have any notifications turned on, and if so, what.
        if(twitchObject.bot.messages && twitchObject.bot.messages.follow) {
            let followMessages = twitchObject.bot.messages.follow;
            
            for(var key in followMessages) {
                if (followMessages.hasOwnProperty(key)) {
                    let val = followMessages[key].replaceAll("{channel}", twitchObject.channel).replaceAll("{username}", followData.user.name);;
                    if(key.equalsIgnoreCase("broadcast")) {
                        chatClient.broadcast(val);
                    } else if(key.equalsIgnoreCase("all")) {
                        let message = val.replaceAll("{channel}", twitchObject.channel).replaceAll("{username}", followData.user.name);
                        chatClient.say(channel, val);
                    } else if(key.equalsIgnoreCase(channelName)) {
                        chatClient.say(channel, val);
                    }
                }
            }
        }
        
        //Alerts
        if(twitchObject.bot.alerts && twitchObject.bot.alerts.follow) {
            let followMessages = twitchObject.bot.alerts.follow;
            let options = {};
            let hasAlert = false;
            
            for(var key in followMessages) {
                if (followMessages.hasOwnProperty(key)) {
                    if(key.equalsIgnoreCase("default")) {
                        options = followMessages[key];
                        hasAlert = true;
                        break;
                    }
                }
            }
            
            
            for(var key in followMessages) {
                if (followMessages.hasOwnProperty(key)) {
                    if(key.equalsIgnoreCase("default")) {
                        continue;
                    } else if(key.equalsIgnoreCase(channelName)) {
                        hasAlert = true;
                        for(var ky2 in followMessages[key]) {
                            if(!followMessages[key].hasOwnProperty(ky2)) continue;
                            options[ky2] = followMessages[key][ky2];
                        }
                    }
                }
            }
            
            if(hasAlert) {            
                if(options.title) options.title = options.title.replaceAll("{channel}", twitchObject.channel).replaceAll("{username}", followData.user.name);
                if(options.subtitle) options.subtitle = options.subtitle.replaceAll("{channel}", twitchObject.channel).replaceAll("{username}", followData.user.name);
                
                options.type = "twitch_follow";
                options.typeData = followData;
                
                let alert = new SimpleAlert(options);
                
                if(options.extraClasses) alert.extraClasses = options.extraClasses;
                
                alert.queue();
            }
        }
        
        //End Alerts
    });
}