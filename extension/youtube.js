'use strict';

module.exports = function (nodecg,app) {
    //Validate config
    if(!nodecg.bundleConfig || !nodecg.bundleConfig.youtube || !nodecg.bundleConfig.youtube.client|| !nodecg.bundleConfig.youtube.secret || !nodecg.bundleConfig.youtube.redirect) {
        console.warn("ERROR: YW YouTube Configuration is invalid, missing either youtube.client, youtube.secret and/or youtube.redirect. YouTube will be unavailable.");
    }
    
    //Working.
    const Youtube = require("youtube-api");
    const request = require('request');
    const oauth = Youtube.authenticate({
        type: "oauth",
        client_id: nodecg.bundleConfig.youtube.client,
        client_secret: nodecg.bundleConfig.youtube.secret,
        redirect_url: nodecg.bundleConfig.youtube.redirect
    });
    
    //Replicants
    const yt_auth = nodecg.Replicant('yw_youtube_auth', {defaultValue: null, persistant: false});
    const yt_url = nodecg.Replicant("yw_youtube_auth_url", {defaultValue: null, persistant: false});
    const yt_stream = nodecg.Replicant('yw_youtube_stream', {defaultValue: null, persistant: false});
    
    //Variables
    const yt_checked_messages = {};
    
    //Update Auth URL
    yt_url.value = oauth.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube"]
    });
    
    //Express Handlers
    app.get('/yourwishescg/youtube-auth-set', function(req, res) {
        if(req.query.code) {
            oauth.getToken(req.query.code, (err, tokens) => { 
                if (err) {
                    yt_auth.value = null;
                    console.log(err);
                    return;
                }
                console.log(tokens);
         
                yt_auth.value = tokens;
            });
        }
        res.send('<!DOCTYPE HTML><html lang="en"><head><title></title><meta charset="utf-8" /><script type="text/javascript">window.close();</script></head><body></body></html>');
    });
    
    //Functions
    nodecg.ywYouTubeMessage = function(message) {
        if(!message || !yt_stream || !yt_stream.value || !yt_stream.value.snippet || !yt_stream.value.snippet.liveChatId) return;
        
        Youtube.liveChatMessages.insert({
            part: "id,snippet,authorDetails",
            resource: {
                snippet:  {
                    liveChatId: yt_stream.value.snippet.liveChatId,
                    type: "textMessageEvent",
                    textMessageDetails: {
                        messageText: message
                    }
                }
            }
        }, (err, data) => {
            console.log("Failed to send YouTube message!");
        });
    }
    
    //Replicant Handlers
    yt_auth.on('change', function(newval) {
        yt_stream.value = null;
        if(newval) {
            console.log("YouTube API Available.");
            oauth.setCredentials(newval);
            
            if(nodecg.bundleConfig.youtube.bot && nodecg.bundleConfig.youtube.bot.broadcast) {
                //Call Request to get stream info
                Youtube.liveBroadcasts.list({
                    part: "id,snippet,contentDetails,status",
                    broadcastStatus: "all",
                    maxResults: 40
                }, (err, data) => {
                    if(err) {
                        console.log(err);
                        yt_auth.value = null;
                        return;
                    }
                    if(!data || !data.items || data.items.length < 0) {
                        console.log("Invalid Livestream supplied?");
                        return;
                    }
                    yt_stream.value = data.items[0];
                    console.log("YouTube stream data available.");
                });
            }
            
        } else {
            console.log("YouTube API Unavailable!");
        }
    });
    
    let chatThread = null;
    yt_stream.on('change', function(newval) {
        //Kill the old thread.
        if(chatThread) {
            clearInterval(chatThread);
            chatThread = null;
        }
        
        //Create new chat thread
        if(newval) {
            setInterval(function() {
                if(!yt_stream || !yt_stream.value) return;
                
                //Get the chat
                Youtube.liveChatMessages.list({
                    part: "id,snippet,authorDetails",
                    liveChatId: yt_stream.value.snippet.liveChatId
                }, (err, data) => {
                    if(err) {
                        //Failed to get chat...
                        yt_stream.value = null;
                        console.log("Chat returned an error?");
                        console.log(err);
                        return;
                    }
                    
                    for(let x = 0; x < data.items.length; x++) {
                        let message = data.items[x];
                        if(!message) continue;
                        
                        if(message.id in yt_checked_messages) continue;//We've already handled this message.
                        yt_checked_messages[message.id] = message;
                        
                        let author = message.authorDetails;
                        let txtMessage = message.snippet.displayMessage;
                        let authorName = author.displayName;
                        
                        nodecg.ywHandleChat({type:"youtube",author:author}, yt_stream.value.snippet.liveChatId, txtMessage, authorName);
                    }
                });
            }, 5000);
        }
    });
};