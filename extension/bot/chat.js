'uise strict'

const Commands = require('./commands.js');

module.exports = {
    handleChat: function(scope, channel, message, username) {
        if(message.startsWith("!")) {
            //First, get the CMD
            let args = message.split(" ");
            let cmd = args[0].replace("!", "");
            args.splice(0,1);
            
            //Command
            console.log(username+": !" + cmd + " " + args.join(" "));
            
            Commands.handleCommand(scope, channel, message, username, cmd, args);
        } else {
            console.log("["+scope.type + "] " + username + ": " + message);
        }
    }
}