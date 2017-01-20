(function () {
    'use strict';
    
    //Replicants
    const songQueue = nodecg.Replicant('yw_song_queue');
    const nowPlaying = nodecg.Replicant('yw_now_playing');
    const playingState = nodecg.Replicant('yw_playing_state');
    const playingPosition = nodecg.Replicant('yw_playing_position');
    const songVolume = nodecg.Replicant('yw_song_volume');
    
    //Elements
    let songContainer = document.getElementById("song-container");
    
    //Functions
    let stopCurrentSong = function() {
        songContainer.innerHTML = '';//Not pretty, but seems to work on OBS Studio, so it's good enough for me.
    };
    
    let loadSong = function(songData) {
        stopCurrentSong();
        if(!songData || !songData.file) return;
        console.log("Loading " + songData.name);
        
        var ext = 'audio/';
        if(songData.file.endsWith(".mp3")) {
            ext += 'mp3';
        } else if(songData.file.endsWith(".wav")) {
            ext += 'wav';
        } else if(songData.file.endsWith(".ogg")) {
            ext += 'ogg';
        }
        songContainer.innerHTML = '<audio id="song-audio"><source id="song-source" src="'+songData.file+'" type="'+ext+'"></audio>';
        getSongAudio().addEventListener('ended', function() {
            nextSong();
        });
        getSongAudio().addEventListener('timeupdate', function() {
            let x = parseInt(this.currentTime)%3;
            if(x > 0) return;
            if(playingPosition.value && parseInt(playingPosition.value) == parseInt(this.currentTime)) return;
            playingPosition.value = this.currentTime;
        });
        getSongAudio().preload = "auto";
    };
    
    let getSongAudio = function() {return document.getElementById("song-audio");}
    let getSongSource = function() {return document.getElementById("song-source");}
    let doesCurrentSongExist = function() {return getSongAudio() ? true : false;}
    let getPlayingState = function() {return (playingState && playingState.value && playingState.value == "PLAY") ? true : false;}
    
    let nextSong = function() {
        stopCurrentSong();
        if(!songQueue || !songQueue.value || !songQueue.value.length) {
            songContainer.innerHTML = "";
            nowPlaying.value = undefined;
            return;
        }
        let song = songQueue.value[0];
        let arr = songQueue.value;
        arr.splice(0, 1);
        songQueue.value = arr;
        nowPlaying.value = song;
    }
    
    let playCurrentSong = function() {
        if(!doesCurrentSongExist()) return;
        let el = getSongAudio();
        el.play();
        if(songVolume && songVolume.value) {
            el.volume = songVolume.value;
        }
    };
    
    let pauseCurrentSong = function() {
        if(!doesCurrentSongExist()) return;
        let el = getSongAudio();
        el.pause();
    }
    
    //Repl Events
    nowPlaying.on('change', function(newval) {
        if(!newval || !newval.file) {
            stopCurrentSong();
        } else {
            if(getSongSource() && getSongSource().src == newval.file) {
                playCurrentSong();                
            } else {
                loadSong(newval);
                if(getPlayingState()) playCurrentSong();
            }
        }
    });
    
    songQueue.on('change', function(newval) {
        if(!nowPlaying.value && songQueue.value && songQueue.value.length > 0) nextSong();
    });
    
    playingState.on('change', function(newval) {
        if(getPlayingState()) {
            playCurrentSong();
        } else {
            pauseCurrentSong();
        }
    });
    
    songVolume.on('change', function(newval) {
        if(!newval) return;
        if(!doesCurrentSongExist()) return;
        let el = getSongAudio();
        el.volume = newval;
    });
})();