/* global chrome */
"use strict";
var browser = chrome || browser;



var master = {};
var clickEnabled = true;
var autUrl = null;
var payloadInformation = null;
var recordData = null;
var stepToEdit = null;
let newEditToDebug = [];
var windowId = '';
var xAuthorization='';
var htmlPath ='';
var receiver = null;
var stream_capture = null;
var selfId = null;

function openPanel(tab) {
    // console.log("tab: "+tab);

    chrome.tabCapture.capture(
        {video: true, audio: true,
            videoConstraints: {
                mandatory: {
                    // If minWidth/Height have the same aspect ratio (e.g., 16:9) as
                    // maxWidth/Height, the implementation will letterbox/pillarbox as
                    // needed. Otherwise, set minWidth/Height to 0 to allow output video
                    // to be of any arbitrary size.
                    minWidth: 16,
                    minHeight: 9,
                    maxWidth: 854,
                    maxHeight: 480,
                    maxFrameRate: 60,  // Note: Frame rate is variable (0 <= x <= 60).
                },
            },
        },
        function(stream) {
            if (!stream) {
                console.error('Error starting tab capture: ' +
                    (chrome.runtime.lastError.message || 'UNKNOWN'));
                return;
            }
            if (receiver != null) {
                receiver.close();
            }
            stream_capture = stream;
            // receiver = window.open('receiver.html');
            // receiver.currentStream = stream;
        }

    );


    let contentWindowId = tab.windowId;
    if (master[contentWindowId] != undefined) {
        browser.tabs.sendMessage(windowId, {
            sessionIds: payloadInformation.sessionIds,
            type: "updateSessionIds",
        });
        browser.windows.update(master[contentWindowId], {
            focused: true
        }).catch(function (e) {
            master[contentWindowId] == undefined;
            openPanel(tab);
        });
        return;
    } else if (!clickEnabled) {
        return;
    }

    clickEnabled = false;
    setTimeout(function () {
        clickEnabled = true;
    }, 1000);

    browser.windows.create({
        url: browser.runtime.getURL("src/pages/index.html"),
        type: "popup",
        height: 691,
        width: 300,
    }).then(function waitForPanelLoaded(panelWindowInfo) {
        return new Promise(function (resolve, reject) {
            let count = 0;
            let interval = setInterval(function () {
                if (count > 100) {
                    reject("SideeX editor has no response");
                    clearInterval(interval);
                }

                browser.tabs.query({
                    active: true,
                    windowId: panelWindowInfo.id,
                    status: "complete"
                }).then(function (tabs) {
                    if (tabs.length != 1) {
                        count++;
                        return;
                    } else {
                        master[contentWindowId] = panelWindowInfo.id;
                        
                        resolve(panelWindowInfo);
                        clearInterval(interval);
                    }
                })
            }, 200);
        });
    }).then(function bridge(panelWindowInfo) {
        windowId = panelWindowInfo.tabs[0].id;
        selfId = panelWindowInfo.id;

        return browser.tabs.sendMessage(panelWindowInfo.tabs[0].id, {
            selfWindowId: panelWindowInfo.id,
            commWindowId: contentWindowId,
            payloadInformation: payloadInformation,
            autUrl: autUrl,
            recordData,
            stepToEdit,
            type: "payloadInformation",
            toDebug:false,
            closeUnnecessarytab:tab,
            xAuthorization,
            htmlPath,
            panelWindowInfo
        });


    }).catch(function (e) {
        console.log(e);
    });
}

// if(!play){
    browser.windows.onRemoved.addListener(function (windowId) {
        let keys = Object.keys(master);
        for (let key of keys) {
            if (master[key] === windowId) {
                delete master[key];
                if (keys.length === 1) {
                    browser.contextMenus.removeAll();
                }
            }
        }
    });
// }
// else{

    browser.browserAction.onClicked.addListener(openPanel);
// }


 function newsteparray (step) {
    let valArr = `${step.instrNum}`.split('.');
    let val = valArr.length;
    step.instrNum = JSON.stringify(newEditToDebug.length + 1);
    step.haschild = false;
    step.sendToTestCaseParser = true;
    step.subInstructions = []
    
    try {
        switch (val) {
            case 1:
            newEditToDebug.push({ ...step});
                break;
            case 2:
                newEditToDebug.push({ ...step});
            break;
        }
    } catch (error) {
        console.log(error);
    }
}
var recorderdRevertCommands = {
    "select": "addSelection",
    "click": "clickAt",
    "double": "doubleClickAt",
    "open": "open",
    "remove": "removeSelection",
    "enter": "submit",
    "enter": "type",
    "hit": "submit",
    "hit": "sendKeys",
    "select": "select",
    "verify text": "verifyText",
    "verify if visible": "verifyIfVisible",
    "verify if enabled": "verifyIfEnabled",
    "verify if not visible": "verifyIfNotVisible",
    "verify if not enabled": "verifyIfNotEnabled",
    "modify frame": "selectFrame",
};
function Filterarray (){
    recordData.testSteps.forEach((...step) => {
        var CompoundeState =  step[0].instr.replace(/[\\\/]/g, '/').split('/').length
        var unKnowInstrc = recorderdRevertCommands[step[0].instr.split(' ')[0].toLowerCase()] || false
        if(CompoundeState <= 1 && unKnowInstrc && !step[0].instr.includes('and')){
            newsteparray(step[0]);
        }
    })
}
var port;
browser.contextMenus.onClicked.addListener(function (info, tab) {
    port.postMessage({ cmd: info.menuItemId });
});

browser.runtime.onConnect.addListener(function (m) {
    port = m;
});

browser.runtime.onMessageExternal.addListener(
    function (request, sender, sendResponse) {

        if(request && request.message && (request.message == "pause" || request.message == "record")) {
            browser.tabs.sendMessage(windowId, {
                msg: request.message,
                type: 'msg'
            });
            sendResponse({ version: 20.0 });
            // console.log("request:");
            // consoel.log(request.message);


        }
        if (request && request.message && request.message == "version") {
            play = true
            sendResponse({ version: 1.0 });
        }
        if(request && request.message && request.message == "checking"){
            sendResponse({ version: 6.0, message: "mil gyaaaaaa" });
        }
        if (request && request.eventType && request.eventType == "autonomiq" && request.payload ) {
            autUrl = request.payload.autUrl;
            payloadInformation = request.payload.payloadInformation;
            recordData = request.payload.RecordData;
            stepToEdit = request.payload.fIndex;
            xAuthorization = request.payload.token;
            htmlPath = request.payload.htmlPath;

            if(recordData){
                chrome.tabs.create({ url: autUrl }, openPanel);
            }
            else{
                chrome.tabs.create({ url: autUrl }, openPanel);
            }

        }
        if (request && request.eventType && request.eventType == "htmlTEST" && request.payload ) {
            autUrl = request.payload.autUrl;
            payloadInformation = request.payload.payloadInformation;
            recordData = request.payload.RecordData;
            stepToEdit = request.payload.fIndex;
            xAuthorization = request.payload.token;
            htmlPath = request.payload.htmlPath;
            if(recordData){
                chrome.tabs.create({ url: autUrl }, function (newWindow) {
                })
            }
        }
});


//**** Hide open website on new tab for development propose ****/

// browser.runtime.onInstalled.addListener(function(details) {
//
//
//     if (details.reason == "install" || details.reason == "update") {
//         browser.tabs.create({url: "https://www.autonomiq.io"});
//     }
// });




// /* global chrome */
// "use strict";

// var browser = chrome || browser;

// browser.browserAction.onClicked.addListener(openPanel);


// function openPanel () {
//     browser.windows.create({
//         url: browser.runtime.getURL("src/pages/index.html"),
//         type: "popup",
//         height: 600,
//         width: 300,
//     }).then(function waitForPanelLoaded(panelWindowInfo) {
//             return new Promise(function (resolve, reject) {
//                 console.log(panelWindowInfo, ">>>>>>>>>>>>>>>>")
//                 browser.tabs.query({
//                     active: true,
//                     windowId: panelWindowInfo.id,
//                     status: "complete"
//                 })
//         });
//     })
// };