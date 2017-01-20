'use stricvt';

const fs = require('fs');
const commandsDir = './bundles/yourwishescg/extension/bot/bot_commands';
const botCommands = [];

module.exports = {
    loadCommands: function() {
        botCommands.clear();
        
        if(!fs.existsSync(commandsDir)) {
            fs.mkdirSync(commandsDir);
        }
        
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
    },
    
    getCommands: function() {
        return botCommands;
    },
    
    handleCommand: function(scope, channel, message, username, command, args) {
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
        let response = tryCommand.command(username, command, args, scope);
        
        //Now we have the response we need to route it to the appropriate location
        if(scope.type == "twitch") {
            scope.handle.say(channel, response);
        } else if(scope.type == "youtube") {
            //nodecg.ywYouTubeMessage(response);
        }
    }
}