(function () {
    'use strict';
    
    //HTML Elements
    const auth_button = document.getElementById("twitch-auth");
    const bot_list = document.getElementById("bot-list");
    
    if(nodecg.bundleConfig && nodecg.bundleConfig.twitch && nodecg.bundleConfig.twitch.bots) {
        let BotStatusSync = setInterval(function() {
            nodecg.sendMessage('GetTwitchBotStatus', {}, function(result) {
                if(typeof result !== typeof []) return;
                for(var i = 0; i < result.length; i++) {
                    let element = document.getElementById("bot-"+result[i].username.toLowerCase()+"-status");
                    if(!element) {
                        let bot = result[i].bot;
                        let lowerName = bot.username.toLowerCase();
                        let x = bot.username + '<div class="status status-pending" id="bot-'+lowerName+'-status" data-username="'+lowerName+'">Loading...</div>';
                        
                        let botElement = document.createElement("div");
                        botElement.id = "bot-" + lowerName;
                        botElement.addClass("bot");
                        botElement.innerHTML = x;
                        bot_list.appendChild(botElement);
                        
                        element = document.getElementById("bot-"+result[i].username.toLowerCase()+"-status");
                        element.addEventListener('click', function() {
                            if(!this.hasClass("status-online")) return;
                            this.addClass('status-pending');
                            this.removeClass('status-offline');
                            this.removeClass('status-online');
                            this.innerHTML = "Loading...";
                            
                            nodecg.sendMessage('DeauthorizeTwitchBot', this.getAttribute("data-username"));
                        });
                    } else {
                        element.removeClass('status-pending');
                        element.removeClass('status-offline');
                        element.removeClass('status-online');
                        
                        if(result[i].status.equalsIgnoreCase("online")) {
                            element.addClass("status-online");
                            element.innerHTML = "Online";
                        } else if(result[i].status.equalsIgnoreCase("offline")) {
                            element.addClass("status-offline");
                            element.innerHTML = '<a href="'+result[i].authURL+'" target="_blank">Offline</a>';
                        }
                    }
                }
            });
        }, 2000);
    }
})();