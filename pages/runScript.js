var isWanted = false
window.onerror = function(msg){
	if(isWanted){
		window.postMessage({
			direction: "from-page-runscript",
			result: msg
		}, "*");
		isWanted = false;
	}
};
window.addEventListener("message", function(event) {
	if(event && event.type === "updatedTestCases" && event.data && event.data.steps){
		console.log(event.data);
	}

	if (event.source == window && event.data && event.data.direction == "from-content-runscript") {
		console.log(event)
		isWanted = true;
		var doc = window.document;
		var scriptTag = doc.createElement("script");
		scriptTag.type = "text/javascript"
		scriptTag.text = event.data.script;
		doc.body.appendChild(scriptTag);
	}
});
