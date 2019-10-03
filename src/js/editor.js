/* global chrome */
"use strict";
var browser = chrome || browser;

/* recording */
var selfWindowId = -1;
var contentWindowId;
var notificationCount = 0;

var recorder = new BackgroundRecorder();

/* flags */
var isRecording = false;
var isPlaying = false;

class Editor {

}

function handleMessage(message, sender, sendResponse) {
    if (message.selectTarget) {

        var target = message.target;
        // show first locator by default
        var locatorString = target[0][0];
        if (locatorString.includes("d-XPath")) locatorString = "auto-located-by-tac";

        // Update toolbar
        document.getElementById("command-target").value = locatorString;
        var target_dropdown = document.getElementById("target-dropdown");
        var command_target_list = document.getElementById("command-target-list");
        emptyNode(target_dropdown);
        emptyNode(command_target_list);

        var locatorList = document.createElement("datalist");
        for (var m = 0; m < message.target.length; ++m) {
            var option = document.createElement("option");
            option.textContent = message.target[m][0];
            target_dropdown.appendChild(option.cloneNode(true));
            command_target_list.appendChild(option);
        }

        var selectedRecordId = getSelectedRecord();

        // If selecting a command, change the target inside.
        if (selectedRecordId != "") {
            var selectedRecord = document.getElementById(selectedRecordId);
            var datalist = selectedRecord.getElementsByTagName("td")[1].getElementsByTagName("datalist")[0];

            // Update locator data list
            emptyNode(datalist);
            for (var m = 0; m < message.target.length; ++m) {
                var option = document.createElement("option");
                option.textContent = message.target[m][0];
                datalist.appendChild(option);
            }

            // Update target view, show first locator by default
            var node = getTdShowValueNode(selectedRecord, 1);
            if (node.childNodes && node.childNodes[0])
                node.removeChild(node.childNodes[0]);
            node.appendChild(document.createTextNode(locatorString));

            // Update hidden actual locator value
            node = getTdRealValueNode(selectedRecord, 1);
            if (node.childNodes && node.childNodes[0])
                node.removeChild(node.childNodes[0]);
            node.appendChild(document.createTextNode(locatorString));

        } else if (document.getElementsByClassName("record-bottom active").length > 0) {
            // If selecting a blank command;
            addCommandAuto("", target, "");
        }

        return;
    }
    if (message.cancelSelectTarget) {
        var button = document.getElementById("selectElementButton");
        isSelecting = false; 
        button.textContent = "Select";
        browser.tabs.sendMessage(sender.tab.id, {selectMode: true, selecting: false});
        return;
    }

    if (message.attachRecorderRequest) {
        if (isRecording && !isPlaying) {
                browser.tabs.sendMessage(sender.tab.id, {attachRecorder: true})
        }
        return;
    }
}

browser.runtime.onMessage.addListener(handleMessage);

browser.runtime.onMessage.addListener(function contentWindowIdListener(message) {
    if (message.selfWindowId != undefined && message.commWindowId != undefined) {
        selfWindowId = message.selfWindowId;
        contentWindowId = message.commWindowId;
        extCommand.setContentWindowId(contentWindowId);
        recorder.setOpenedWindow(contentWindowId);
        recorder.setSelfWindowId(selfWindowId);
        browser.runtime.onMessage.removeListener(contentWindowIdListener);
    }
})

function notification(command, target, value) {
    var endDuration = document.getElementById('end-duration');
    var maxLength = getRecordsArray().length;
    endDuration.textContent = maxLength + 1;
    let tempCount = String(notificationCount);
    notificationCount++;
    // In Chrome, notification.create must have "iconUrl" key in notificationOptions
    var current_target = target[0][0];
    if(command.indexOf('verify') > -1 ){
        // To show xpath on notification if it is verify
        current_target = target[target.length - 1][0]
    }
    browser.notifications.create(tempCount, {
        "type": "basic",
        "iconUrl": "/icons/icons-48.png",
        "title": "Command Recorded",
        "message": "command: " + String(command) + "\ntarget: " + tacPreprocess(String(current_target)) + "\nvalue: " + String(value) 
    });

    browser.notifications.onClicked.addListener(function(notificationId) {
        browser.windows.update(window.selfWindowId,{focused:true});
    });

    setTimeout(function() {
        browser.notifications.clear(tempCount);
    }, 4500);
}

function tacPreprocess(target) {
    if (target.includes("d-XPath")) return "auto-located-by-tac";
    return target;
}