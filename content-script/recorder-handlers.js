console.log(Recorder.addEventHandler, "asd")

Recorder.inputTypes = ["text", "password", "file", "datetime", "datetime-local", "date", "month", "time", "week", "number", "range", "email", "url", "search", "tel", "color"];

Recorder.addEventHandler('clickAt', 'click', function(event) {
    console.log(event, "<<<<<<<<<<<<")

}, true);

Recorder.addEventHandler('dbClick', 'dbclick', function(event) {
    console.log(event, ">>>>>>>>>>>>>")
}, true);