// TODO: seperate UI
class BackgroundRecorder {
    constructor() {
        this.currentRecordingTabId = {};
        this.currentRecordingWindowId = {};
        this.currentRecordingFrameLocation = {};
        this.openedTabNames = {};
        this.openedTabIds = {};
        this.openedTabCount = {};

        this.openedWindowIds = {};
        this.contentWindowId = -1;
        this.selfWindowId = -1;
        this.attached = false;
        this.rebind();
    }

    // TODO: rename method
    tabsOnActivatedHandler(activeInfo) {
        let testCase = getSelectedCase();
        if (!testCase) {
            return;
        }
        let testCaseId = testCase.id;
        if (!this.openedTabIds[testCaseId]) {
            return;
        }

        var self = this;
        // Because event listener is so fast that selectWindow command is added
        // before other commands like clicking a link to browse in new tab.
        // Delay a little time to add command in order.
        setTimeout(function () {
            if (self.currentRecordingTabId[testCaseId] === activeInfo.tabId && self.currentRecordingWindowId[testCaseId] === activeInfo.windowId)
                return;
            // If no command has been recorded, ignore selectWindow command
            // until the user has select a starting page to record the commands
            if (getRecordsArray().length === 0)
                return;
            // Ignore all unknown tabs, the activated tab may not derived from
            // other opened tabs, or it may managed by other SideeX panels
            if (self.openedTabIds[testCaseId][activeInfo.tabId] == undefined)
                return;
            // Tab information has existed, add selectWindow command
            self.currentRecordingTabId[testCaseId] = activeInfo.tabId;
            self.currentRecordingWindowId[testCaseId] = activeInfo.windowId;
            self.currentRecordingFrameLocation[testCaseId] = "root";
            addCommandAuto("selectWindow", [[self.openedTabIds[testCaseId][activeInfo.tabId]]], "");
        }, 150);
    }

    windowsOnFocusChangedHandler(windowId) {
        let testCase = getSelectedCase();
        if (!testCase) {
            return;
        }
        let testCaseId = testCase.id;
        if (!this.openedTabIds[testCaseId]) {
            return;
        }

        if (windowId === browser.windows.WINDOW_ID_NONE) {
            // In some Linux window managers, WINDOW_ID_NONE will be listened before switching
            // See MDN reference :
            // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/windows/onFocusChanged
            return;
        }

        // If the activated window is the same as the last, just do nothing
        // selectWindow command will be handled by tabs.onActivated listener
        // if there also has a event of switching a activated tab
        if (this.currentRecordingWindowId[testCaseId] === windowId)
            return;

        let self = this;

        browser.tabs.query({
            windowId: windowId,
            active: true
        }).then(function (tabs) {
            if (tabs.length === 0 || self.isPrivilegedPage(tabs[0].url)) {
                return;
            }

            // The activated tab is not the same as the last
            if (tabs[0].id !== self.currentRecordingTabId[testCaseId]) {
                // If no command has been recorded, ignore selectWindow command
                // until the user has select a starting page to record commands
                if (getRecordsArray().length === 0)
                    return;

                // Ignore all unknown tabs, the activated tab may not derived from
                // other opened tabs, or it may managed by other SideeX panels
                if (self.openedTabIds[testCaseId][tabs[0].id] == undefined)
                    return;

                // Tab information has existed, add selectWindow command
                self.currentRecordingWindowId[testCaseId] = windowId;
                self.currentRecordingTabId[testCaseId] = tabs[0].id;
                self.currentRecordingFrameLocation[testCaseId] = "root";
                addCommandAuto("selectWindow", [[self.openedTabIds[testCaseId][tabs[0].id]]], "");
            }
        });
    }

    tabsOnRemovedHandler(tabId, removeInfo) {
        let testCase = getSelectedCase();
        if (!testCase) {
            return;
        }
        let testCaseId = testCase.id;
        if (!this.openedTabIds[testCaseId]) {
            return;
        }

        if (this.openedTabIds[testCaseId][tabId] != undefined) {
            if (this.currentRecordingTabId[testCaseId] !== tabId) {
                addCommandAuto("selectWindow", [
                    [this.openedTabIds[testCaseId][tabId]]
                ], "");
                addCommandAuto("close", [
                    [this.openedTabIds[testCaseId][tabId]]
                ], "");
                addCommandAuto("selectWindow", [
                    [this.openedTabIds[testCaseId][this.currentRecordingTabId[testCaseId]]]
                ], "");
            } else {
                addCommandAuto("close", [
                    [this.openedTabIds[testCaseId][tabId]]
                ], "");
            }
            delete this.openedTabNames[testCaseId][this.openedTabIds[testCaseId][tabId]];
            delete this.openedTabIds[testCaseId][tabId];
            this.currentRecordingFrameLocation[testCaseId] = "root";
        }
    }

    webNavigationOnCreatedNavigationTargetHandler(details) {
        let testCase = getSelectedCase();
        if (!testCase)
            return;
        let testCaseId = testCase.id;
        if (this.openedTabIds[testCaseId][details.sourceTabId] != undefined) {
            this.openedTabNames[testCaseId]["win_ser_" + this.openedTabCount[testCaseId]] = details.tabId;
            this.openedTabIds[testCaseId][details.tabId] = "win_ser_" + this.openedTabCount[testCaseId];
            if (details.windowId != undefined) {
                this.setOpenedWindow(details.windowId);
            } else {
                // Google Chrome does not support windowId.
                // Retrieve windowId from tab information.
                let self = this;
                browser.tabs.get(details.tabId)
                    .then(function (tabInfo) {
                        self.setOpenedWindow(tabInfo.windowId);
                    });
            }
            this.openedTabCount[testCaseId]++;
        }
    };

    iconToggle(message){
        if(message.conditionTracking && (message.conditionTracking.Pause == true || message.conditionTracking.Recording)){
            console.log(message.conditionTracking.iconUrl, "YAHUHUHUHUHu");
            if(message && message.conditionTracking.iconUrl.indexOf("fa-stop-circle")){

                document.getElementById('recordIconChange').classList.add('fa-pause-circle');
                document.getElementById('recordIconChange').classList.remove('fa-stop-circle');                
            }
            else if(message && message.conditionTracking.iconUrl.indexOf("fa-pause-circle")){

                document.getElementById('recordIconChange').classList.add('fa-stop-circle');
                document.getElementById('recordIconChange').classList.remove('fa-pause-circle');
            }
           if(document.getElementById('recordIconChange').classList.contains('fa-stop-circle')){
                document.getElementById('recordIconChange').style.color = '#fc5d5c';
            }
            if(document.getElementById('recordIconChange').classList.contains('fa-pause-circle')){
                document.getElementById('recordIconChange').style.color = '#3b91df';
            }
        }
    }

    addCommandMessageHandler(message, sender, sendRequest) {
        this.iconToggle(message);
        if(message.conditionTracking && message.conditionTracking.Recording){
        // skip any clickAt command if it's "select(choose)" command is stored in saveObj
        if(message && message.command === 'clickAt') {
            let savedArray = getSelectedCase() ? getSaveObj(getSelectedCase().id) : null;
            let lastInsertedMessage = savedArray ? savedArray[savedArray.length > -1 ? savedArray.length -1 : 0] : null;
            if(lastInsertedMessage && lastInsertedMessage.label === message.label && lastInsertedMessage.xpath === message.xpath) {
                return;
            }
        }
        // console.log(message.label);
        if (!message.command || this.openedWindowIds[sender.tab.windowId] == undefined || recorderCommands[message.command] === null)
            return;
        if (!getSelectedSuite() || !getSelectedCase()) {
            let id = "case" + sideex_testCase.count;
            sideex_testCase.count++;
            addTestCase("First Test Case", id);
        }

        let testCaseId = getSelectedCase().id;
        let testSuiteId = getSelectedSuite().id;

        if (!this.openedTabIds[testCaseId]) {
            this.openedTabIds[testCaseId] = {};
            this.openedTabNames[testCaseId] = {};
            this.currentRecordingFrameLocation[testCaseId] = "root";
            this.currentRecordingTabId[testCaseId] = sender.tab.id;
            this.currentRecordingWindowId[testCaseId] = sender.tab.windowId;
            this.openedTabCount[testCaseId] = 1;
        }

        if (Object.keys(this.openedTabIds[testCaseId]).length === 0) {
            this.currentRecordingTabId[testCaseId] = sender.tab.id;
            this.currentRecordingWindowId[testCaseId] = sender.tab.windowId;
            this.openedTabNames[testCaseId]["win_ser_local"] = sender.tab.id;
            this.openedTabIds[testCaseId][sender.tab.id] = "win_ser_local";
        }

        saveArray = getSaveObj(getSelectedCase().id);

        if (getRecordsArray().length === 0) {
            addCommandAuto("open", [
                [sender.tab.url]
            ], message.label, "");
            saveArray.push({
                'xpath': "",
                'label': sender.tab.url,
                'command': "open",
                'value': "",
                'selectedSuite': sideex_testSuite[testSuiteId].title,
                'selectedCase': sideex_testCase[testCaseId].title
            })
        }
            /* For Save Button */
            message["selectedSuite"] = sideex_testSuite[testSuiteId].title;
            message["selectedCase"] = sideex_testCase[testCaseId].title;

            // ON Enter Hit change label to 'Enter Key'
            if(message && message.command === 'sendKeys')
                message.label = message.value === '${KEY_ENTER}' ? 'Enter Key' : message.label;

                saveArray.push(message);
                console.log("message: ", message);
                console.log("saved Array: ", saveArray);
            setSaveArr(getSelectedCase().id, saveArray);

        if (this.openedTabIds[testCaseId][sender.tab.id] == undefined)
            return;

        /* if (message.frameLocation !== this.currentRecordingFrameLocation[testCaseId]) {
            let newFrameLevels = message.frameLocation.split(':');
            let oldFrameLevels = this.currentRecordingFrameLocation[testCaseId].split(':');
            while (oldFrameLevels.length > newFrameLevels.length) {
                addCommandAuto("selectFrame", [
                    ["relative=parent"]
                ], message.label, "");
                oldFrameLevels.pop();
            }
            while (oldFrameLevels.length != 0 && oldFrameLevels[oldFrameLevels.length - 1] != newFrameLevels[oldFrameLevels.length - 1]) {
                addCommandAuto("selectFrame", [
                    ["relative=parent"]
                ], message.label, "");
                oldFrameLevels.pop();
            }
            while (oldFrameLevels.length < newFrameLevels.length) {
                addCommandAuto("selectFrame", [
                    ["index=" + newFrameLevels[oldFrameLevels.length]]
                ], message.label, "");
                oldFrameLevels.push(newFrameLevels[oldFrameLevels.length]);
            }
            this.currentRecordingFrameLocation[testCaseId] = message.frameLocation;
        } */

        //Record: doubleClickAt
        if (message.command == "doubleClickAt") {
            var command = getRecordsArray();
            var select = getSelectedRecord();
            var length = (select == "") ? getRecordsNum() : select.split("-")[1] - 1;
            var equaln = getCommandName(command[length - 1]) == getCommandName(command[length - 2]);
            var equalt = getCommandTarget(command[length - 1]) == getCommandTarget(command[length - 2]);
            var equalv = getCommandValue(command[length - 1]) == getCommandValue(command[length - 2]);
            if (getCommandName(command[length - 1]) == "clickAt" && equaln && equalt && equalv) {
                deleteCommand(command[length - 1].id);
                deleteCommand(command[length - 2].id);
                if (select != "") {
                    var current = document.getElementById(command[length - 2].id)
                    current.className += ' selected';
                }
            }
        } else if (message.command.includes("Value") && typeof message.value === 'undefined') {
            sideex_log.error("Error: This element does not have property 'value'. Please change to use storeText command.");
            return;
        } else if (message.command.includes("Text") && message.value === '') {
            sideex_log.error("Error: This element does not have property 'Text'. Please change to use storeValue command.");
            return;
        } else if (message.command.includes("store")) {
            // In Google Chrome, window.prompt() must be triggered in
            // an actived tabs of front window, so we let panel window been focused
            browser.windows.update(this.selfWindowId, { focused: true })
                .then(function () {
                    // Even if window has been focused, window.prompt() still failed.
                    // Delay a little time to ensure that status has been updated
                    setTimeout(function () {
                        message.value = prompt("Enter the name of the variable");
                        if (message.insertBeforeLastCommand) {
                            addCommandBeforeLastCommand(message.command, message.target, message.value);
                        } else {
                            notification(message.command, message.target, message.value);
                            addCommandAuto(message.command, message.target, message.value, message.label);
                        }
                    }, 100);
                })
            return;
        }

        //handle choose ok/cancel confirm
        if (message.insertBeforeLastCommand) {
            addCommandBeforeLastCommand(message.command, message.target, message.value);
        } else {
            notification(message.command, message.target, message.value);
            addCommandAuto(message.command, message.target, message.value, message.label, message.confirmRequired,message,message.conditionTracking);
        }
    }else if(message.conditionTracking.Pause){
        browser.tabs.sendMessage(sender.tab.id, {pause: true})
    }else if(message.conditionTracking.Stop){
        this.attached = false;
        browser.tabs.sendMessage(sender.tab.id, {detachRecorder: true})
        addCommandAuto(message.command, message.target, message.value, message.label, message.confirmRequired,message,message.conditionTracking);
    }
    }
  
    isPrivilegedPage(url) {
        if (url.substr(0, 13) == 'moz-extension' ||
            url.substr(0, 16) == 'chrome-extension') {
            return true;
        }
        return false;
    }

    rebind() {
        this.tabsOnActivatedHandler = this.tabsOnActivatedHandler.bind(this);
        this.windowsOnFocusChangedHandler = this.windowsOnFocusChangedHandler.bind(this);
        this.tabsOnRemovedHandler = this.tabsOnRemovedHandler.bind(this);
        this.webNavigationOnCreatedNavigationTargetHandler = this.webNavigationOnCreatedNavigationTargetHandler.bind(this);
        this.addCommandMessageHandler = this.addCommandMessageHandler.bind(this);
        this.browserPlaceOption = this.browserPlaceOption.bind(this)
    }
    browserPlaceOption(message, sender, sendRequest){
        bodyActionControl(message, sender, sendRequest)
        if(!this.attached){
            browser.tabs.onActivated.removeListener(this.tabsOnActivatedHandler);
            browser.windows.onFocusChanged.removeListener(this.windowsOnFocusChangedHandler);
            browser.tabs.onRemoved.removeListener(this.tabsOnRemovedHandler);
            browser.webNavigation.onCreatedNavigationTarget.removeListener(this.webNavigationOnCreatedNavigationTargetHandler);
            browser.runtime.onMessage.removeListener(this.addCommandMessageHandler);
        }
    }
    attach() {
        if (this.attached) {
            return;
        }
        this.attached = true;
        browser.tabs.onActivated.addListener(this.tabsOnActivatedHandler);
        browser.windows.onFocusChanged.addListener(this.windowsOnFocusChangedHandler);
        browser.tabs.onRemoved.addListener(this.tabsOnRemovedHandler);
        browser.webNavigation.onCreatedNavigationTarget.addListener(this.webNavigationOnCreatedNavigationTargetHandler);
        browser.runtime.onMessage.addListener(this.addCommandMessageHandler);
        browser.runtime.onMessage.addListener(this.browserPlaceOption);
    }

    detach() {
        if (!this.attached) {
            return;
        }
        browser.runtime.onMessage.addListener(this.browserPlaceOption);
    }

    setOpenedWindow(windowId) {
        this.openedWindowIds[windowId] = true;
    }

    setSelfWindowId(windowId) {
        this.selfWindowId = windowId;
    }

    getSelfWindowId() {
        return this.selfWindowId;
    }
}
