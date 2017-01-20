'use strict';

module.exports = function(api, nodecg) {
    nodecg.listenFor('GetTwitchBotStatus', function(value, callback) {
        //First get a list of tokens
        let bots = nodecg.bundleConfig.twitch.bots;
        let x  = [];
        for(var i = 0; i < bots.length; i++) {
            let bot = bots[i];
            let chatClient = api.getChatClient(bot.username);
            let h = {};
            h.username = bot.username;
            if(chatClient) {
                h.status = "online";
            } else {
                h.status = "offline";
                h.authURL = api.getAuthURL();
            }
            h.bot = bot;
            x.push(h);
        }
        
        callback(x);
    });
    
    nodecg.listenFor('DeauthorizeTwitchBot', function(value) {
        let tokens = api.findTokens({
            username: value
        });
        
        for(var i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            token.unvalidate();
            console.log("Deleting token " + token.token);
        }
    });
}