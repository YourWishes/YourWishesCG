(function () {
    'use strict';
    
    let alertQueue = [];
    let currentAlert = null;
        
    let TransitionInTime = 750;
    let TransitionOutTime = 750;
    let borderSize = 8;
    
    nodecg.listenFor('ywShowAlert', function(value) {
        var obj = value;
        alertQueue.push(obj);
    });
    
    let alertTask = setInterval(function() {
        //First we need to check and see if we even need to do alerts
        if(alertQueue.length < 1) return;
        if(currentAlert) return;
        
        let alert = alertQueue[0];
        alertQueue.splice(0, 1);
        currentAlert = alert;
        
        //Now we can build our alert.
        let container = document.getElementsByClassName("alert-container")[0];
        
        let alertWidth = alert.width+borderSize;
        let alertHeight = alert.height+borderSize;
        
        let alertBox = document.createElement("div");
        alertBox.id = "alert-"+alert.id;
        alertBox.setAttribute("data-id", alert.id);
        alertBox.addClass("alert-box");
        if(alert.extraClasses) {
            for(var i = 0; i < alert.extraClasses.length; i++) {
                alertBox.addClass(alert.extraClasses[i]);
            }
        }
        alertBox.style.width = alertWidth+"px";
        alertBox.style.height = alertHeight+"px"
        
        if(alert.position.left) alertBox.style.left = alert.position.left;
        if(alert.position.right) alertBox.style.right = alert.position.right;
        if(alert.position.top) alertBox.style.top = alert.position.top;
        if(alert.position.bottom) alertBox.style.bottom = alert.position.bottom;
        
        
        let x = '<div class="alert-box-inner">';
        
        x += '<div class="alert-box-scroller"></div>';
        x += '<div class="alert-box-border left"></div>';
        x += '<div class="alert-box-border bottom"></div>';
        x += '<div class="alert-box-border right"></div>';
        x += '<div class="alert-box-border top"></div>';
        
        x += '<div class="alert-box-body" style="width:'+alert.width+'px;height:'+alert.height+'px;">';
        x += alert.html;
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
        alertBox.innerHTML = x;
        
        container.appendChild(alertBox);
        
        if(alert.volume) {
            let alertSoundElement = document.getElementById("alert-sound-"+alert.id);
            if(alertSoundElement) {
                alertSoundElement.volume = alert.volume;
            }
        }
        
        setTimeout(function() {
            //Get the currently queued item
            let alertElement = document.getElementById("alert-"+currentAlert.id);
            alertElement.addClass("hidden");//Hides it
            
            //Now another timeout (This is to say "Yes the queue is clear")
            setTimeout(function() {
                let alertElement = document.getElementById("alert-"+currentAlert.id);
                alertElement.remove();//Cleanup
                currentAlert = undefined;
            }, TransitionOutTime);
        }, alert.life+TransitionInTime);
    }, 200);
})();