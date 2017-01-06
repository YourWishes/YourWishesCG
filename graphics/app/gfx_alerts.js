(function () {
    'use strict';
    let nextAlertID = 0;
    let alertQueue = [];
    let currentAlert = undefined;
    
    nodecg.listenFor('ywShowAlert', function(value) {
        var title = "Test Title<br />second line";
        var image = "images/twitter.png";
        var life = 5000;
        
        alertQueue.push({
            id: nextAlertID++,
            title: title,
            image: image,
            life: life
        });
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
        var height = 100;
        var life = 4000;
        
        if(alert.life) life = alert.life;
        
        var boxPos = "left: 8px;bottom: 8px;";
        var alertWidth = width+(4*2);
        var alertHeight = height+(4*2);
        
        var x = '<div class="alert-box" style="'+boxPos+';width:'+alertWidth+'px;height:'+alertHeight+'px;" id="alert-box-'+alert.id+'">';
        x += '<div class="alert-box-inner">';
        
        x += '<div class="alert-box-scroller"></div>';
        x += '<div class="alert-box-border left"></div>';
        x += '<div class="alert-box-border bottom"></div>';
        x += '<div class="alert-box-border right"></div>';
        x += '<div class="alert-box-border top"></div>';
        x += '<div class="alert-box-body" style="width:'+width+'px;height:'+height+'px;">';
        x += '<div class="alert-image"><img src="'+alert.image+'" /></div>';
        x += '<div class="alert-title">'+alert.title+'</div>';
        x += '</div>';
        
        x += '</div>';
        x += '</div>';
        
        container.innerHTML = x;
        
        //Now we need to set the "Hide the alert" timer
        setTimeout(function() {
            //Get the currently queued item
            let alertElement = document.getElementById("alert-box-"+currentAlert.id);
            alertElement.className += " hidden";//Hides it
            
            //Now another timeout (This is to say "Yes the queue is clear")
            setTimeout(function() {
                currentAlert = undefined;
            }, 750);
        }, life);
    }, 200);
})();