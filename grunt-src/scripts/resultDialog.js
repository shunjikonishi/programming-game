function ResultDialog($el) {
	function show(data) {
		var title = MSG.draw,
			name = data.winner,
			detail = MSG.format(MSG.result_detail2, data.salesforce, data.heroku, data.draw),
			$head = $el.find(".modal-header");
		$head.removeClass("heroku salesforce");
		if (name !== "draw") {
			title = MSG.format(MSG.win, data.winner);
			name = "win-" + data.winner.toLowerCase();
			$head.addClass(data.winner.toLowerCase());
			if (data.winner.toLowerCase() === "salesforce") {
				detail = MSG.format(MSG.result_detail, data.salesforce, data.heroku, data.draw);
			} else {
				detail = MSG.format(MSG.result_detail, data.heroku, data.salesforce, data.draw);
			}
		}
		$el.find(".modal-title").text(title);
		$el.find(".result-detail").text(detail);
		$el.find("img").attr("src", "/assets/images/illust/" + name + ".png");
		setTimeout(function() {
			$el.modal({
				"show": true
			});
		}, 500);
	}
	$.extend(this, {
		"show": show
	});
}