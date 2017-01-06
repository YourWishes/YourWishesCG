(function () {
    'use strict';
    
    //Replicants
    let btnTest = document.getElementById("btnTest");
    
    btnTest.addEventListener('click', function() {
        nodecg.sendMessage('ywShowAlert', {
            title: "Hello World",
            body: "Nice meem!"
        });
    });
})();