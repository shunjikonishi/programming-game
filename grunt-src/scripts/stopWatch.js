function StopWatch($el) {
	function show() {
		var min = Math.floor(second / 60),
			sec = second % 60,
			text = ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2);
console.log("sw", second, min, sec);
		$el.text(text);
	}
	function countDown() {
		second--;
		show();
		if (second > 0) {
			setTimeout(countDown, 1000);
		} else if (callback) {
			$el.hide();
			callback();
		}
	}
	function start(sec, func) {
		$el.show();
		second = sec;
		callback = func;
		show();
		setTimeout(countDown, 1000);
	}
	var second = 0,
		callback = null;
	$.extend(this, {
		"start": start
	});
}