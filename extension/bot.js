'use strict';

module.exports = function (nodecg,app) {
    const fs = require('fs');
    const botCommands = [];
    
    let commandsDir = './bundles/yourwishescg/extension/bot_commands';
    let commandFiles = fs.readdirSync(commandsDir);
    for(var i = 0; i < commandFiles.length; i++) {
        let cmdFile = commandFiles[i];
        let cmd = require('./bot_commands/'+cmdFile.replace(".js", ""));
        //Validate command
        if(!cmd || !cmd.label || !cmd.command || typeof cmd.command !== 'function') {
            console.log("Invalid Command " + cmdFile + "!");
            continue;
        }
        
        botCommands.push(cmd);
    }
    
    nodecg.ywHandleChat = function(scope, channel, message, username) {
        if(message.startsWith("!")) {
            //First, get the CMD
            let args = message.split(" ");
            let cmd = args[0].replace("!", "");
            args.splice(0,1);
            
            //Command
            console.log(username+": !" + cmd + " " + args.join(" "));
            
            handleCommand(scope, channel, message, username, cmd, args);
        } else {
            console.log("["+scope.type + "] " + username + ": " + message);
        }
    }
    
    //Functions
    let handleCommand = function(scope, channel, message, username, command, args) {
        let cmdLower =  command.toLowerCase();
        
        //First try to find the command that matches this label
        let tryCommand = undefined;
        
        for(var i = 0; i < botCommands.length; i++) {
            let cmd = botCommands[i];
            if(cmd.enabled == false) continue;
            
            if(cmd.label.toLowerCase() == cmdLower) {
                tryCommand = cmd;
                break;
            }
            
            if(!cmd.aliases) continue;
            for(var x = 0; x < cmd.aliases.length; x++) {
                let alias = cmd.aliases[x];
                if(alias.toLowerCase() != cmdLower) continue;
                tryCommand = cmd;
                break;
            }
        }
        
        if(!tryCommand) return;
        
        //Update Scope
        scope.nodecg = nodecg;
        let response = tryCommand.command(username, command, args, scope);
        
        //Now we have the response we need to route it to the appropriate location
        if(scope.type == "twitch") {
            scope.handle.say(nodecg.bundleConfig.twitch.bot.channel, response);
        } else if(scope.type == "youtube") {
            nodecg.ywYouTubeMessage(response);
        }
    }
};