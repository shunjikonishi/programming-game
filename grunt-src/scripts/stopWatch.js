function StopWatch($el) {
	function show(rest) {
		var min = Math.floor(rest / 60),
			sec = rest % 60,
			text = ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2);
		$el.text(text);
	}
	function countDown() {
		var rest = Math.floor((limit - new Date().getTime()) / 1000);
		show(rest);
		if (rest > 0) {
			setTimeout(countDown, 1000);
		} else {
			running = false;
			$el.hide();
			if (callback) {
				callback();
			}
		}
	}
	function start(sec, func) {
		running = true;
		limit = new Date().getTime() + (sec * 1000);
		$el.show();
		callback = func;
		show(sec);
		setTimeout(countDown, 1000);
	}
	function hide() {
		$el.hide();
	}
	function isRunning() { 
		return running;
	}
	var limit = -1,
		callback = null,
		running = false;
	$.extend(this, {
		"start": start,
		"isRunning": isRunning,
		"hide": hide
	});
}