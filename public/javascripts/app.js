if (typeof(pg) == "undefined") pg = {};

(function ($) {
"use strict";

var FIELD_SIZE = 50;

function showError(msg) {
	alert(msg);
}


pg.Application = function(id) {
	function random(n) {
		return Math.floor(Math.random() * n);
	}
	function generateObject(cnt, Func) {
		while (cnt > 0) {
			var x = random(game.width),
				y = random(game.height),
				field = game.field(x, y);
			if (!field.hasObject()) {
				field.object(new Func());
				cnt--;
			}
		}
	}
	function entry(imageSrc) {
		if (!game) {
			return;
		}
		while (true) {
			var x = random(game.width),
				y = random(game.height),
				field = game.field(x, y);
			if (!field.hasObject()) {
				game.addPlayer(new Player(imageSrc, x, y));
				return;
			}
		}
	}
	var game = null;
	$("#game-gen").click(function() {
		if (game != null) {
			return;
		}
		var setting = new GameSetting();

		game = new Game($("#game"), setting.fieldWidth(), setting.fieldHeight());
		generateObject(setting.wallCount(), Wall);
		generateObject(setting.wallCount(), Point);
		$(this).prop("disabled", true);
	});
	$("#salesforce-entry").click(function() {
		entry("/assets/images/salesforce.jpg");
		$(this).prop("disabled", true);
	});
	$("#heroku-entry").click(function() {
		entry("/assets/images/heroku.png");
		$(this).prop("disabled", true);
	});
};

function GameSetting() {
	this.fieldWidth = function() { return $("#field-width").val();};
	this.fieldHeight = function() { return $("#field-height").val();};
	this.pointCount = function() { return $("#point-count").val();};
	this.wallCount = function() { return $("#wall-count").val();};
}
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
})(jQuery);
