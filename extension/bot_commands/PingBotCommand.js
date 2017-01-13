exports.label = "ping";
exports.aliases = ["ping", "pong", "test"];
exports.throttle = 3000;
exports.enabled = false;
exports.command = function(sender, label, args, scope) {
    return "Pong!";
};