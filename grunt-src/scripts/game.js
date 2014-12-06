function Game($el, width, height) {
	function init() {
		$el.width(width * FIELD_SIZE);
		$el.height(width * FIELD_SIZE);
		for (var x=0; x<width; x++) {
			var line = [];
			fields.push(line);
			for (var y=0; y<height; y++) {
				var $field = $("<div class='field'/>");
				$el.append($field);
				line.push(new Field($field, x, y));
			}
		}
		$el.show();
	}
	function field(x, y) {
		return fields[x][y];
	}
	function addPlayer(player) {
		if (players.length === 2) {
			showError(MSG.tooManyPlayers);
		}
		players.push(player);
		$el.append(player.element());
	}
	var fields = [],
		players = [];
	$.extend(this, {
		"width": width,
		"height": height,
		"field": field,
		"addPlayer": addPlayer
	});
	init();
}

function Field($el, x, y) {
	var obj = null;
	function hasObject() { return !!this.obj;}
	function object(v) {
		if (v === undefined) {
			return obj;
		} else {
			obj = v;
			$el.empty().append(obj.image);
		}
	}
	$.extend(this, {
		"hasObject": hasObject,
		"object": object
	});
}

function FieldObject(imageSrc, enterable) {
	var $img = $("<img/>");
	$img.attr("src", imageSrc);
	$img.addClass("object");

	function image() { return $img;}
	function canEnter() { return enterable;}
	$.extend(this, {
		"image": image,
		"canEnter": canEnter
	});
}

function Wall() {
	this.__proto__ = new FieldObject("/assets/images/wall.png", false);
}

function Point() {
	this.__proto__ = new FieldObject("/assets/images/gold.png", true);
}