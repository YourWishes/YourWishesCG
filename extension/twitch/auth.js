'use strict';

const TwitchAPI = require('./TwitchAPI.js');

module.exports = function(nodecg, app) {
    app.get('/yourwishescg/twitch-token', function(req, res) {
        //We need a valid token and a valid "from URL"
        if(req.query.access_token && req.query.scope && req.query.path) {
            let twitch = TwitchAPI.getByRedirect(req.query.path);
            if(twitch) {
                twitch.validateToken(req.query.access_token, req.query.scope);
            }
        }
        
        let HTML_HEADER = '<!DOCTYPE HTML><html lang="en"><head><title></title><meta charset="utf-8" />';
        let HTML_FOOTER = '</head><body></body></html>';
        res.send('<script type="text/javascript">window.close();</script>'+HTML_FOOTER);
    });
}