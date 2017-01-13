(function () {
    'use strict';
    
    //Replicants
    const songQueue = nodecg.Replicant('yw_song_queue');
    const nowPlaying = nodecg.Replicant('yw_now_playing');
    const playingState = nodecg.Replicant('yw_playing_state');
    const playingPosition = nodecg.Replicant('yw_playing_position');
    const songVolume = nodecg.Replicant('yw_song_volume');
    const preExistingSongs = nodecg.Replicant('yw_previous_songs');
    
    //Elements
    let divSongQueue = document.getElementById("song-queue");
    let divVolumeSlider = document.getElementById("slideVolume");
    let btnPlayPause = document.getElementById("btnPlayPause");
    let btnNextSong = document.getElementById("btnNextSong");
    let btnClearList = document.getElementById("btnClearList");
    let txtNowPlaying = document.getElementById("txtNowPlaying");
    let divExistingSongQueue = document.getElementById("existing-song-queue");
    
    let txtYoutube = document.getElementById("txtYoutube");
    let txtSongTitle = document.getElementById("txtSongTitle");
    let txtSongArtist = document.getElementById("txtSongArtist");
    let btnDownloadSong = document.getElementById("btnDownloadSong");
    
    //Functions
    let updateSongQueueList = (songs) => {
        if(typeof songs === typeof undefined) songs = songQueue.value;
        if(typeof songs === typeof undefined) return;
        let x = '';
        
        for(var i = 0; i < songs.length; i++) {
            let song = songs[i];
            x += '<div class="song">';
            x += '<button type="button" class="btnRemoveSong btnSmall" style="float:right" data-index="'+i+'">X</button>';
            x += song.name;
            if(song.artist) x += " - " + song.artist;
            x += '</div>';
        }
        divSongQueue.innerHTML = x;
        
        let els = document.getElementsByClassName("btnRemoveSong");
        for(var i = 0; i < els.length; i++) {
            els[i].addEventListener('click', function() {
                var index = parseInt(this.getAttribute("data-index"));
                let arr = songQueue.value;
                arr.splice(index, 1);
                songQueue.value = arr;
            });
        }
    };
    
    //Listeners
    songQueue.on('change', updateSongQueueList);
    playingState.on('change', function(newval) {
        if(newval == "PLAY") {
            btnPlayPause.innerHTML = "Pause";
        } else {
            btnPlayPause.innerHTML = "Play";
        }
    });
    
    songVolume.on('change', function(newval) {
        divVolumeSlider.value = newval*100;
    });
    
    nowPlaying.on('change', function(newval) {
        if(newval && newval.name) {
            txtNowPlaying.value = "Now Playing: " + newval.name + (newval.artist?" - " + newval.artist : "");
        } else {
            txtNowPlaying.value = "Not Playing.";
        }
    });
    
    preExistingSongs.on('change', function(newval) {
        let x = '';
        
        if(newval && newval.length > 0) {
            for(var i = 0; i < newval.length; i++) {
                let song = newval[i];
                x += '<div class="song">';
                x += '<button type="button" class="btnPlaySong btnSmall" style="float:right" data-index="'+i+'">+</button>';
                x += song.name;
                if(song.artist) x += " - " + song.artist;
                x += '</div>';
            }
        }
        
        divExistingSongQueue.innerHTML = x;
        
        let els = document.getElementsByClassName("btnPlaySong");
        for(var i = 0; i < els.length; i++) {
            els[i].addEventListener('click', function() {
                var index = parseInt(this.getAttribute("data-index"));
                let arr = preExistingSongs.value[index];
                songQueue.value.push(arr);
            });
        }
    });
    
    //Handlers
    btnPlayPause.addEventListener('click', () => {
        if(playingState.value == "PLAY") {
            playingState.value = "PAUSE";
        } else {
            playingState.value = "PLAY";
        }
    });
    
    btnNextSong.addEventListener('click', () => {
        if(!songQueue || !songQueue.value || !songQueue.value.length) {
            nowPlaying.value = undefined;
            return;
        }
        let song = songQueue.value[0];
        let arr = songQueue.value;
        arr.splice(0, 1);
        songQueue.value = arr;
        nowPlaying.value = song;
    });
    
    btnClearList.addEventListener('click', () => {
        songQueue.value = [];
    });
    
    btnDownloadSong.addEventListener('click', () => {
        if(!txtYoutube.value) alert("Missing YouTube ID");
        
        var obj = {
            id: txtYoutube.value
        };
        
        if(txtSongTitle.value && txtSongTitle.value.length > 0) obj.name = txtSongTitle.value;
        if(txtSongArtist.value && txtSongArtist.value.length > 0) obj.artist = txtSongArtist.value;
        nodecg.sendMessage('ywDownloadYTSong', obj);
        
        txtSongTitle.value = "";
        txtSongArtist.value = "";
        txtYoutube.value = "";
    });
    
    divVolumeSlider.onchange = function() {
        songVolume.value = parseFloat(this.value)/100.0;
    }
})();