function ResultDialog($el) {
	function show(name) {
		$el.find("img").attr("src", "/assets/images/illust/" + name + ".png");
		setTimeout(function() {
			$el.modal({
				"show": true
			});
		}, 800);
	}
	function win(name) {
		$el.find(".modal-title").text(MSG.format(MSG.win, name));
		show("win-" + name.toLowerCase());
	}
	function draw() {
		$el.find(".modal-title").text(MSG.draw);
		show("draw");
	}
	$.extend(this, {
		"win": win,
		"draw": draw
	});
}