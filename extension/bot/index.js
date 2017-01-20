'use strict';

const Commands = require('./commands.js');
const Chat = require('./chat.js');

module.exports = function(nodecg, app) {
    Commands.loadCommands();
    
    console.log("Registered " + Commands.getCommands().length + " commands.");
};