(function () {
    'use strict';
    
    //Replicants
    const yw_past_alerts = nodecg.Replicant('yw_past_alerts');
    
    //Elements
    let prevAlertContainer = document.getElementById("prev-alerts");
    let btnClearAlerts = document.getElementById("btnClearAlerts");
    
    //Listeners
    btnClearAlerts.addEventListener('click', function() {
        yw_past_alerts.value = [];
    });
    
    yw_past_alerts.on('change', function(newval) {
        var x = '';
        for(var i = newval.length-1; i >= 0 && i >= newval.length-39; i--) {
            var alert = newval[i];
            x += '<div class="prev-alert" data-index="'+i+'">';
            x += '<button type="button" class="btn-repeat-alert" data-index="'+i+'">Repeat</button>';
            x += '<div class="title">'+alert.title+'</div>';
            if(alert.subtitle) x += '<div class="subtitle">'+alert.subtitle+'</div>';
            x += '</div>';
        }
        prevAlertContainer.innerHTML = x;
        
        let elements = document.getElementsByClassName("btn-repeat-alert");
        for(var i = 0; i < elements.length; i++) {
            elements[i].addEventListener('click', function() {
                let id = parseInt(this.getAttribute("data-index"));
                let alert = yw_past_alerts.value[id];
                if(!alert) return;
                nodecg.sendMessage('ywShowAlert', alert);
            });
        }
    });
})();