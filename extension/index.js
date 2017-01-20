'use strict';
const app = require('express')();
const fs = require('fs');
const utils = require('./utils/index.js');

module.exports = function (extensionApi) {
    console.log("Loading YourWishesCG...");
    let nodecg = extensionApi;
    
    //Create our data folder
    if (!fs.existsSync('./yourwishescg')){
        fs.mkdirSync('./yourwishescg');
    }
    
    if(!nodecg || !nodecg.bundleConfig || Object.keys(nodecg.bundleConfig).length == 0) {
        console.log("Generating a default configuration...");
        
        let defaultConfiguration = {
            "twitch": {
                "client": "your_client_id",
                "secret": "your_secret_id",
                "redirect": "http://localhost:9090/yourwishescg/twitch-auth",
                "bots": [
                    {
                        "username": "YouWishBot",
                        "channels": ["yourwishes", "youwishbot"],
                        "messages": {
                            "join": {
                                "youwishbot": "I am online!"
                            },
                            "follow": {
                                "yourwishes": "Thank you {username} for following!",
                                "youwishbot": "Thank you {username} for following! I suggest checking out http://twitch.tv/yourwishes for my main channel!"
                            }
                        },
                        
                        "alerts": {
                            "follow": {
                                "yourwishes": {
                                    "title": "New Follower!",
                                    "subtitle": "Welcome {username}!",
                                    "life": 6000,
                                    "sound": "sounds/ok_lets_do_this.wav",
                                    "image": "images/heart_animated.gif",
                                    "position": {
                                        "left": "685px",
                                        "top": "12px"
                                    },
                                    "extraClasses": [
                                        "follower-alert"
                                    ]
                                }
                            }
                        }
                    }
                ]
            },
            "music": {
                "alerts": {
                    "play": {
                        "title": "{song}",
                        "subtitleArtist": "{artist}",
                        "subtitileNoArtist": "",
                        "image": "images/music_animated.gif"
                    }
                }
            }
        };
        
        utils.mkdirsSync('./cfg');
        fs.writeFileSync('./cfg/yourwishescg.json', JSON.stringify(defaultConfiguration, undefined, 4));
    }
    
    //Import main components.
    require('./utils/index.js');
    require('./bot/index.js')(nodecg,app);
    require('./alerts/index.js')(nodecg, app);
    require('./twitch/index.js')(nodecg,app);
    require('./music/index.js')(nodecg, app);
    
    /*
    require('./youtube.js')(nodecg,app);
    require('./music.js')(nodecg,app);
    require('./alerts.js')(nodecg,app);
    */
    
    //Mount Express Stuff
    nodecg.mount(app);
    
    console.log("YourWishesCG loaded!");
};