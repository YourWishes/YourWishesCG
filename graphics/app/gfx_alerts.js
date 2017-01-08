(function () {
    'use strict';
    let nextAlertID = 0;
    let alertQueue = [];
    let currentAlert = undefined;
    
    nodecg.listenFor('ywShowAlert', function(value) {
        var obj = value;
        obj.id = nextAlertID++;
        
        alertQueue.push(obj);
    });
    
    setInterval(() => {
        //Check the queue
        if(alertQueue.length < 1) return;//No point running.
        if(typeof currentAlert != typeof undefined) return;//There's an alert already present.
        
        var alert = alertQueue[0];//Pull the top of the queue
        alertQueue.splice(0, 1);//Remove the top of the queue
        currentAlert = alert;//Self Explanitory
        
        //Now we can build our alert.
        var container = document.getElementsByClassName("alert-container")[0];
        
        //Check the styles.
        var width = 550;
        var height = 80;
        var life = 4000;
        
        if(alert.life) life = alert.life;
        
        var boxPos = "left: 8px;bottom: 8px;";
        var alertWidth = width+(4*2);
        var alertHeight = height+(4*2);
        
        var title = alert.title;
        //I'm parsing this cuz the font I use doesn't have symbols...
        title = title.replace(/[^\w\s]/g,'');
        title = title.replace(' ', '&nbsp;&nbsp;&nbsp;&nbsp;');//My font had a weird spacing thing going on.
        
        var x = '<div class="alert-box" style="'+boxPos+';width:'+alertWidth+'px;height:'+alertHeight+'px;" id="alert-box-'+alert.id+'">';
        x += '<div class="alert-box-inner">';
        
        x += '<div class="alert-box-scroller"></div>';
        x += '<div class="alert-box-border left"></div>';
        x += '<div class="alert-box-border bottom"></div>';
        x += '<div class="alert-box-border right"></div>';
        x += '<div class="alert-box-border top"></div>';
        x += '<div class="alert-box-body" style="width:'+width+'px;height:'+height+'px;">';
        if(alert.image) x += '<div class="alert-image"><img src="'+alert.image+'" /></div>';
        x += '<div class="alert-title">';
        x += '<div class="title">'+title+'</div>';
        if(alert.subtitle) x += '<div class="subtitle">'+alert.subtitle+'</div>';
        x += '</div>';
        x += '</div>';
        
        x += '</div>';
        
        if(alert.sound && (!getQueryVariable("sound") || getQueryVariable("sound") != "false")) {
            console.log("Sound Found");
            var ext = 'audio/';
            if(alert.sound.endsWith(".mp3")) {
                ext += 'mp3';
            } else if(alert.sound.endsWith(".wav")) {
                ext += 'wav';
            } else if(alert.sound.endsWith(".ogg")) {
                ext += 'ogg';
            }
            x += '<audio autoplay id="alert-sound-'+alert.id+'"><source src="'+alert.sound+'" type="'+ext+'"></audio>';
        }
        
        x += '</div>';
        
        container.innerHTML = x;
        
        if(alert.volume) {
            let alertSoundElement = document.getElementById("alert-sound-"+alert.id);
            if(alertSoundElement) {
                alertSoundElement.volume = alert.volume;
            }
        }
        
        //Now we need to set the "Hide the alert" timer
        setTimeout(function() {
            //Get the currently queued item
            let alertElement = document.getElementById("alert-box-"+currentAlert.id);
            alertElement.addClass("hidden");//Hides it
            
            //Now another timeout (This is to say "Yes the queue is clear")
            setTimeout(function() {
                currentAlert = undefined;
            }, 750);
        }, life);
    }, 200);
    
    
    
    /*
     * Song Stuff
     */
    
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
    };
    
    let getSongAudio = function() {return document.getElementById("song-audio");}
    let getSongSource = function() {return document.getElementById("song-source");}
    let doesCurrentSongExist = function() {return getSongAudio() ? true : false;}
    let getPlayingState = function() {return (playingState && playingState.value && playingState.value == "PLAY") ? true : false;}
    
    let nextSong = function() {
        stopCurrentSong();
        if(!songQueue || !songQueue.value || !songQueue.value.length) {
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