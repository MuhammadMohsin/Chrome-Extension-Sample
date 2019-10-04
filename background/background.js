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
        url: browser.runtime.getURL("../src/index.html"),
        type: "popup",
        height: 600,
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





browser.browserAction.onClicked.addListener(openPanel);
