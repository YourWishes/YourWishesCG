module.exports = {
    label: "np",
    aliases: ["song", "currentsong", "nowplaying", "music"],
    throttle: 3000,
    enabled: true,
    command: function(sender, label, args, scope) {
        let nowPlaying = scope.nodecg.Replicant('yw_now_playing');

        if(nowPlaying && nowPlaying.value && nowPlaying.value.name) {
            let x = "Currently playing ";
            if(nowPlaying.value.artist) x += nowPlaying.value.artist + " - ";
            x += nowPlaying.value.name;
            return x;
        } else {
            return "No song is currently playing!";
        }
    }
};