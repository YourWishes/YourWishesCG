(function () {
    'use strict';
    
    //Elements
    let btnShowAlert = document.getElementById("btnShowAlert");
    let inpAlertTitle = document.getElementById("inpAlertTitle");
    let inpAlertSubtitle = document.getElementById("inpAlertSubtitle");
    let inpAlertDuration = document.getElementById("inpAlertDuration");
    let inpAlertImage = document.getElementById("inpAlertImage");
    let inpAlertSound = document.getElementById("inpAlertSound");
    let inpAlertVolume = document.getElementById("inpAlertVolume");
    
    btnShowAlert.addEventListener('click', function() {
        let obj = {
            title: inpAlertTitle.value
        };
        
        let alertSubtitle = inpAlertSubtitle.value;
        if(alertSubtitle.length > 0) obj.subtitle = alertSubtitle;
        
        let alertDuration = parseInt(inpAlertDuration.value);
        if(alertDuration) obj.life = alertDuration;
        
        let alertImage = inpAlertImage.value;
        if(alertImage.length > 0) obj.image = alertImage;
        
        let alertSound = inpAlertSound.value;
        if(alertSound.length > 0) obj.sound = alertSound;
        
        let alertVolume = parseInt(inpAlertVolume.value);
        if(alertVolume) obj.volume = alertVolume/100.0;
        
        nodecg.sendMessage('ywShowAlert', obj);
    });
})();