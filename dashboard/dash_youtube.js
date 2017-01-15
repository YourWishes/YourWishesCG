(function () {
    'use strict';
    const auth_button = document.getElementById("youtube-auth");
    
    //Replicants
    const yt_auth = nodecg.Replicant('yw_youtube_auth', {defaultValue: null, persistant: false});
    const yt_url = nodecg.Replicant("yw_youtube_auth_url", {defaultValue: null, persistant: false});
    
    if(!nodecg.bundleConfig || !nodecg.bundleConfig.youtube || !nodecg.bundleConfig.youtube.client || !nodecg.bundleConfig.youtube.redirect|| !nodecg.bundleConfig.youtube.secret) {
        auth_button.disabled = true;
        return;
    }
    
    yt_auth.on('change', (val) => {
        if(val) {
            auth_button.innerHTML = "Deauthorize YouTube";
            auth_button.disabled = false;
        } else {
            auth_button.innerHTML = "Authorize YouTube";
            auth_button.disabled = false;
        }
    });
    
    //Check existing Twitch Authentication
    auth_button.addEventListener('click', () => {
        if(yt_auth.value) {
            yt_auth.value = undefined;
        } else {
            window.open(yt_url.value);
        }
    });
})();