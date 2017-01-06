(function () {
    'use strict';
    const auth_button = document.getElementById("twitch-auth");
    
    //Replicants
    const twitch_auth_test = nodecg.Replicant('yw_twitch_auth_test');
    const twitch_auth = nodecg.Replicant('yw_twitch_auth');
    
    if(!nodecg.bundleConfig || !nodecg.bundleConfig.twitch || !nodecg.bundleConfig.twitch.client || !nodecg.bundleConfig.twitch.redirect) {
        auth_button.disabled = true;
        return;
    }
    
    twitch_auth.on('change', (val) => {
        if(val) {
            auth_button.innerHTML = "Deauthorize Twitch";
            auth_button.disabled = false;
        } else {
            auth_button.innerHTML = "Authorize Twitch";
            auth_button.disabled = false;
        }
    });
    
    //Check existing Twitch Authentication
    auth_button.addEventListener('click', () => {
        if(twitch_auth.value) {
            twitch_auth_test.value = undefined;
        } else {
            let uri = getTwitchAuthTokenURL(nodecg.bundleConfig.twitch.client, nodecg.bundleConfig.twitch.redirect);
            window.open(uri);
        }
    });
    
    //General Functions
    function getTwitchAuthTokenURL(client_id, redirect_uri, scope) {
        if(typeof scope === typeof undefined) scope = 'channel_editor';
        let x = 'https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=';
        x += encodeURIComponent(client_id);
        x += '&redirect_uri='+encodeURIComponent(redirect_uri);
        x += '&scope='+encodeURIComponent(scope);
        return x;
    }
})();