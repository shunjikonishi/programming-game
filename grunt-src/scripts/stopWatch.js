function StopWatch($el) {
	function show() {
		var min = Math.floor(second / 60),
			sec = second % 60,
			text = ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2);
		$el.text(text);
	}
	function countDown() {
		second--;
		show();
		if (second > 0) {
			setTimeout(countDown, 1000);
		} else {
console.log("stopWatch finish", callback);
			running = false;
			$el.hide();
			if (callback) {
				callback();
			}
		}
	}
	function start(sec, func) {
		running = true;
		$el.show();
		second = sec;
		callback = func;
		show();
		setTimeout(countDown, 1000);
	}
	function isRunning() { 
		return running;
	}
	var second = 0,
		callback = null,
		running = false;
	$.extend(this, {
		"start": start,
		"isRunning": isRunning
	});
}