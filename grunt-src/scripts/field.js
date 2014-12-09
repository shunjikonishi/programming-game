function Field($el, x, y) {
	var obj = null;
	function hasObject() { return !!obj;}
	function object(v) {
		if (v === undefined) {
			return obj;
		} else {
			obj = v;
			$el.empty().append(obj.image);
		}
	}
	$.extend(this, {
		"x": x,
		"y": y,
		"hasObject": hasObject,
		"object": object
	});
}

function FieldObject(name, imageSrc, enterable) {
	var $img = $("<img/>");
	$img.attr("src", imageSrc);
	$img.addClass("object");

	function image() { return $img;}
	function canEnter() { return enterable;}
	function visible(v) {
		if (v === undefined) {
			return !!$img.hasClass("hide");
		} else if (v) {
			$img.removeClass("hide");
		} else {
			$img.addClass("hide");
		}
	}
	$.extend(this, {
		"name": function() { return name;},
		"image": image,
		"canEnter": canEnter,
		"visible": visible
	});
}

function Wall() {
	this.__proto__ = new FieldObject("wall", "/assets/images/wall.png", false);
}

function Point() {
	this.__proto__ = new FieldObject("point", "/assets/images/gold.png", true);
}