function Player(imageSrc, x, y) {
	function init() {
		var $img = $("<img/>");
		$img.attr("src", imageSrc);
		$div.append($img);
		$div.addClass("player");
		pos(x, y);
	}
	function element() {
		return $div;
	}
	function pos(x, y) {
		var left = x * FIELD_SIZE,
			top = y * FIELD_SIZE;
		$div.css({
			"left": left,
			"top": top
		});
	}
	var $div = $("<div/>");

	$.extend(this, {
		"element": element
	});
	init();
}