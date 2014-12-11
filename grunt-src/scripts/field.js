function Field($el, x, y) {
	var obj = null;
	function hasObject() { return !!obj;}
	function object(v) {
		if (v === undefined) {
			return obj;
		} else {
			obj = v;
			$el.empty().append(obj.image());
			if (obj.hasAddition()) {
				$el.append(obj.addition());
			}
		}
	}
	$.extend(this, {
		"x": x,
		"y": y,
		"hasObject": hasObject,
		"object": object
	});
}

function FieldObject(name, imageSrc, enterable, $addition) {
	var $img = $("<img/>");
	$img.attr("src", imageSrc);
	$img.addClass("object");

	function image() { return $img;}
	function canEnter() { return enterable;}
	function visible(v) {
		if (v === undefined) {
			return !$img.hasClass("hide");
		} else if (v) {
			$img.removeClass("hide");
			if ($addition) {
				$addition.removeClass("hide");
			}
		} else {
			$img.addClass("hide");
			if ($addition) {
				$addition.addClass("hide");
			}
		}
	}
	function hasAddition() {
		return !!$addition;
	}
	function addition() {
		return $addition;
	}
	$.extend(this, {
		"name": function() { return name;},
		"image": image,
		"canEnter": canEnter,
		"visible": visible,
		"hasAddition": hasAddition,
		"addition": addition
	});
}

function Wall() {
	this.__proto__ = new FieldObject("wall", "/assets/images/wall.png", false);
}

function Point(point, pointVisible) {
	var $addition = $("<div/>");
	$addition.addClass("point");
	$addition.text(pointVisible ? point : "?");
	this.__proto__ = new FieldObject("point", "/assets/images/gold.png", true, $addition);
	$.extend(this, {
		"point": function() { return point;},
		"pointVisible": function() { return pointVisible;}
	});
}