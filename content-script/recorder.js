class Recorder {

    constructor(window) {
        this.window = window;
        this.attached = false;
        this.Ginterval;
        // this.frameLocation = this.getFrameLocation();
        this.startEleCount;
        this.locatorBuilders = new LocatorBuilders(window);
        this.EleCounter = 0;
        var selfRCB = this;
        // browser.runtime.sendMessage({
        //     frameLocation: this.frameLocation
        // }).catch(function (reason) {
        //     // Failed silently if receiving end does not exist
        //     //https://image.ibb.co/mDwwVL/text-animation-4-5s-562x100px.gif //loader image

        // });
    }

    parseEventKey(eventKey) {
        if (eventKey.match(/^C_/)) {
            return { eventName: eventKey.substring(2), capture: true };
        } else {
            return { eventName: eventKey, capture: false };
        }
    };

    attach() {
        if (this.attached) {
            return;
        }
        this.attached = true;
        this.eventListeners = {};
        var self = this;
        for (let eventKey in Recorder.eventHandlers) {
            var eventInfo = this.parseEventKey(eventKey);
            var eventName = eventInfo.eventName;
            var capture = eventInfo.capture;

            // create new function so that the variables have new scope.
            function register() {
                var handlers = Recorder.eventHandlers[eventKey];
                var listener = function (event) {
                    for (var i = 0; i < handlers.length; i++) {
                        handlers[i].call(self, event);
                    }
                };
                this.window.document.addEventListener(eventName, listener, capture);
                this.eventListeners[eventKey] = listener;
            }

            register.call(this);
        }
    }

    detach() {
        if (!this.attached) {
            return;
        }
        this.attached = false;
        for (let eventKey in this.eventListeners) {
            var eventInfo = this.parseEventKey(eventKey);
            var eventName = eventInfo.eventName;
            var capture = eventInfo.capture;
            this.window.document.removeEventListener(eventName, this.eventListeners[eventKey], capture);
        }

        delete this.eventListeners;
    }

    getFrameLocation() {
        let currentWindow = window;
        let currentParentWindow;
        let frameLocation = "";
        while (currentWindow !== window.top) {
            currentParentWindow = currentWindow.parent;
            for (let idx = 0; idx < currentParentWindow.frames.length; idx++)
                if (currentParentWindow.frames[idx] === currentWindow) {
                    frameLocation = ":" + idx + frameLocation;
                    currentWindow = currentParentWindow;
                    break;
                }
        }
        return frameLocation = "root" + frameLocation;
    }

};

Recorder.eventHandlers = {};
Recorder.addEventHandler = function (handlerName, eventName, handler, options) {
    handler.handlerName = handlerName;
    if (!options) options = false;
    let key = options ? ('C_' + eventName) : eventName;
    if (!this.eventHandlers[key]) {
        this.eventHandlers[key] = [];
    }
    this.eventHandlers[key].push(handler);
};


var recorder = new Recorder(window);

recorder.attach();