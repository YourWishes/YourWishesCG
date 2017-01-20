'use strict';

const utils = require('../utils/index.js');
const ChatBot = require('../bot/index.js');
const Chat = require('../bot/chat.js');

module.exports = function(api, nodecg) {
    //Token validation (and bot creation)
    api.on('tokenValidated', function(token) {
        if(!token || !token.scopes || !token.scopes.includes('chat_login')) return;
        
        //A token was validated, let's see if one of our bots needs ton be added to the channel.
        if(!nodecg.bundleConfig.twitch.bots) return;
        
        for(var i = 0; i < nodecg.bundleConfig.twitch.bots.length; i++) {
            let bot = nodecg.bundleConfig.twitch.bots[i];
            if(!bot) continue;
            if(!bot.username) continue;
            if(!bot.channels) continue;
            if(bot.channels.length < 1) continue;
            
            if(!bot.username.equalsIgnoreCase(token.user_name)) continue;
            
            //Make sure this bot isn't already attached...
            let existingClient = this.getChatClient(token.user_name);
            if(existingClient) {
                this.chatClients.remove(existingClient);
                existingClient.disconnect();
            }
            
            //Add this bot to the channels
            let channels = [];
            for(var x = 0; x < bot.channels.length; x++) {
                let c = bot.channels[x].toLowerCase();
                if(!c.startsWith("#")) c = "#"+c;
                channels.push(c);
            }
            if(channels.length < 1) continue;
            
            let chatClient = token.createTMI(channels);
            chatClient.botIndex = i;
            chatClient.botData = utils.cloneObject(bot);
            
            //This is the Chat Bot's events handler, this is more of a passthrough tbh.
            chatClient.on('connected', function() {this.twitchAPI.emit('chatBotConnected', this); });
            chatClient.on('join', function(channel, username, self) { this.twitchAPI.emit('chatBotJoinChannel', this, channel, username); });
            chatClient.on("message", function(channel, userstate, message, self) { this.twitchAPI.emit('chatBotMessage', this, channel, userstate, message); });
            chatClient.connect();
        }
    });
    
    api.on('chatBotConnected', function(bot) {
        console.log("Twitch chat bot online!");
    });
    
    api.on('chatBotJoinChannel', function(bot, channel, username) {
        console.log("Twitch chat bot joined " + channel);
        if(!bot.botData.messages) return;
        if(!bot.botData.messages.join) return;
        
        let rawChannel = channel.replace("#", "");
        
        if(bot.botData.messages.join.broadcast) {
            let message = bot.botData.messages.join.broadcast + "";
            message = message.replaceAll("{channel}",rawChannel).replaceAll("{username}", username);
            bot.say(channel, message);
        }
        
        if(bot.botData.messages.join[rawChannel]) {
            let message = bot.botData.messages.join[rawChannel] + "";
            message = message.replaceAll("{channel}", rawChannel).replaceAll("{username}", username);
            bot.say(channel, message);
        }
    });
    
    api.on('chatBotMessage', function(chatClient, channel, userstate, message) {
        if (!userstate || !userstate["display-name"]) return;
        // Handle different message types..
        switch(userstate["message-type"]) {
            case "action":
                // This is an action message.. (/me)
                break;
            case "chat":
                Chat.handleChat({
                    type:"twitch",
                    handle:chatClient,
                    userstate:userstate,
                    nodecg:nodecg,
                    bot: chatClient.botData
                }, channel, message, userstate["display-name"]);
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