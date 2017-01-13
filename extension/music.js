'use strict';

const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

module.exports = function (nodecg,app) {
    if(!fs.existsSync('./bundles/')) fs.mkdirSync('./bundles/');
    if(!fs.existsSync('./bundles/yourwishescg/')) fs.mkdirSync('./bundles/yourwishescg/');
    if(!fs.existsSync('./bundles/yourwishescg/graphics/')) fs.mkdirSync('./bundles/yourwishescg/graphics/');
    if(!fs.existsSync('./bundles/yourwishescg/graphics/songs/')) fs.mkdirSync('./bundles/yourwishescg/graphics/songs/');
    
    //Replicants
    const songQueue = nodecg.Replicant('yw_song_queue', {defaultValue: [], persistant: true});
    const nowPlaying = nodecg.Replicant('yw_now_playing', {persistant: true});
    const playingState = nodecg.Replicant('yw_playing_state', {defaultValue: "PAUSE", persistant: true});
    const playingPosition = nodecg.Replicant('yw_playing_position', {persistant: true});
    const songVolume = nodecg.Replicant('yw_song_volume', {defaultValue: 0.1, persistant: true});
    const preExistingSongs = nodecg.Replicant('yw_previous_songs', {defaultValue: [], persistant: false});
    
    //Functions
    let alertSong = function(song) {
        if(!song || !song.name) return;
        let obj = {
            title: song.name,
            image: "images/music_animated.gif",
            life: 5000
        };
        if(song.artist) obj.subtitle = song.artist;
        nodecg.sendMessage('ywShowAlert', obj);
    }
    
    let refreshPreloadedSongs = function() {
        console.log("Refreshing Preloaded songs")
        let dir = './bundles/yourwishescg/graphics/songs/';
        let results = fs.readdirSync(dir);
        let existingSongs = [];
        for(var i = 0; i < results.length; i++) {
            var d = dir + results[i];
            var json = d + '/info.json';
            if(!fs.existsSync(json)) continue;
            let x = JSON.parse(fs.readFileSync(json));
            existingSongs.push(x);
        }
        preExistingSongs.value = existingSongs;
    };
    
    refreshPreloadedSongs();
    
    //Listeners
    nowPlaying.on('change', function(newval, oldval) {
        if(newval && oldval && newval.name == oldval.name) return;
        alertSong(newval);
        if(newval) console.log("Now Playing: " + newval.name)
    });

    nodecg.listenFor('ywDownloadYTSong', function(value) {
        if(!value || !value.id) return;
        
        let id = value.id;
        if(id.startsWith("http") || id.startsWith("www")) {
            id = nodecg.getQueryVariable("v", value.id);
        }
        
        let dir = './bundles/yourwishescg/graphics/songs/'+id+'/';
        if(!fs.existsSync(dir)) fs.mkdirSync(dir);
        
        
        let url = 'https://www.youtube.com/watch?v='+id;
        let audioOutput = dir+'audio.mp4';
        let infoOutput = dir+'info.json';
        value.file = 'songs/'+id+'/audio.mp3';
        
        let redownload = false
        if(!redownload && fs.existsSync(dir+'audio.mp3') && fs.existsSync(infoOutput)) {
            let x = JSON.parse(fs.readFileSync(infoOutput));
            songQueue.value.push(x);
            console.log("Song already exists, queuing " + infoOutput.name);
            return;
        }
        
        if(!value.name) return;
        
        if(fs.existsSync(audioOutput)) fs.unlinkSync(audioOutput);
        if(fs.existsSync(infoOutput)) fs.unlinkSync(infoOutput);
        
        fs.writeFileSync(infoOutput, JSON.stringify(value));
        
        console.log("Downloading " + url);
        let doesThisWork = ytdl(url, { filter: function(f) { return f.container === 'mp4' && !f.encoding; } })
            // Write audio to file since ffmpeg supports only one input stream.
            .pipe(fs.createWriteStream(audioOutput))
            .on('finish', function() {
                console.log("Finished Downloading, Converting... "  + url);
                let file = this.path.slice(0, -4)+".mp3";
                ffmpeg()
                    .input(ytdl(url, { filter: function(f) {return f.container === 'mp4' && !f.audioEncoding; } }))
                    .videoCodec('copy')
                    .input(audioOutput)
                    .toFormat('mp3')
                    .saveToFile(file, function(stdout, stderr) {
                        if(stderr) console.log(stderr)
                    }).on('end', function() {
                        console.log("Finished Converting " + url);
                        //Delete the .mp4, we don't need it.
                        if(fs.existsSync(audioOutput)) fs.unlinkSync(audioOutput);
                        
                        let x = JSON.parse(fs.readFileSync(infoOutput));
                        
                        //Now we can queue the song
                        songQueue.value.push(x);
                    });
                ;
            })
        ;
    });
};