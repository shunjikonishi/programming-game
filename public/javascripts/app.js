if (typeof(pg) == "undefined") pg = {};

(function ($) {
"use strict";

var FIELD_SIZE = 50;

function showError(msg) {
	alert(msg);
}


pg.Application = function(id) {
	function init() {
		$("#game-gen").click(function() {
			var setting = new GameSetting();
			game.reset(setting.fieldWidth(), setting.fieldHeight());
			generateObject(setting.wallCount(), Wall);
			generateObject(setting.wallCount(), Point);
			$.each(game.getPlayers(), function(idx, p) {
				var pos = randomPos();
				p.reset(pos.x, pos.y);
			});
		});
		$("#salesforce-entry").click(function() {
			if (game.isSalesforceEntried()) {
				return;
			}
			entry("/assets/images/salesforce.jpg");
			$(this).prop("disabled", true);
		});
		$("#heroku-entry").click(function() {
			if (game.isHerokuEntried()) {
				return;
			}
			entry("/assets/images/heroku.png");
			$(this).prop("disabled", true);
		});
	}
	function random(n) {
		return Math.floor(Math.random() * n);
	}
	function randomPos() {
		while (true) {
			var x = random(game.width),
				y = random(game.height),
				field = game.field(x, y);
			if (!field.hasObject()) {
				return {
					"x": x,
					"y": y
				};
			}
		}
	}
	function generateObject(cnt, Func) {
		for (var i=0; i<cnt; i++) {
			var pos = randomPos();
			game.field(pos.x, pos.y).object(new Func());
		}
	}
	function entry(imageSrc) {
		var pos = randomPos();
		game.addPlayer(new Player(imageSrc, pos.x, pos.y));
	}
	var game = new Game($("#game"));
	init();
};

function GameSetting() {
	this.fieldWidth = function() { return $("#field-width").val();};
	this.fieldHeight = function() { return $("#field-height").val();};
	this.pointCount = function() { return $("#point-count").val();};
	this.wallCount = function() { return $("#wall-count").val();};
}
function Game($el) {
	function reset(width, height) {
		self.width = width;
		self.height = height;
		$el.find(".field").remove();
		fields = [];
		$el.width(width * FIELD_SIZE);
		$el.height(height * FIELD_SIZE);
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
	function getPlayers() {
		return players.slice(0);
	}
	function playerExists(method) {
		var ret = false;
		$.each(players,function(idx, p) {
			if (p[method]()) {
				ret = true;
			}
		});
		return ret;
	}
	function isSalesforceEntried() {
		return playerExists("isSalesforce");
	}
	function isHerokuEntried() {
		return playerExists("isHeroku");
	}
	var self = this,
		fields = [],
		players = [];
	$.extend(this, {
		"field": field,
		"addPlayer": addPlayer,
		"reset": reset,
		"getPlayers": getPlayers,
		"isSalesforceEntried": isSalesforceEntried,
		"isHerokuEntried": isHerokuEntried
	});
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
function Player(imageSrc, initialX, initialY) {
	function init() {
		var $img = $("<img/>");
		$img.attr("src", imageSrc);
		$div.append($img);
		$div.addClass("player");
		pos(initialX, initialY);
	}
	function isSalesforce() {
		return imageSrc.indexOf("salesforce") !== -1;
	}
	function isHeroku() {
		return imageSrc.indexOf("heroku") !== -1;
	}
	function element() {
		return $div;
	}
	function reset(nx, ny) {
		commands = [];
		if (nx) {
			initialX = nx;
		}
		if (ny) {
			initialY = ny;
		} 
		pos(initialX, initialY);
	}
	function nextCommand() {
		return commands.shift();
	}
	function commandCount() {
		return commands.length;
	}
	function pos(nx, ny) {
		x = nx;
		y = ny;
		var left = x * FIELD_SIZE,
			top = y * FIELD_SIZE;
		$div.css({
			"left": left,
			"top": top
		});
console.log("pos", left, top);
	}
	function wait() {
		commands.push({
			"command": "wait"
		});
	}
	function move(command, n) {
		n = parseInt(n || 1);
		if (n === 0) {
			wait();
		} else {
			for (var i=0; i<n; i++) {
				commands.push({
					"command": "command"
				});
			}
		}
	}
	function left(n) {
		move("left", n);
	}
	function right(n) {
		move("right", n);
	}
	function up(n) {
		move("up", n);
	}
	function down(n) {
		move("down", n);
	}
	var x, y,
		$div = $("<div/>"),
		commands = [];

	$.extend(this, {
		"element": element,
		"isSalesforce": isSalesforce,
		"isHeroku": isHeroku,
		"nextCommand": nextCommand,
		"commandCount": commandCount,
		"reset": reset,
		"pos": pos,
		"wait": wait,
		"left": left,
		"right": right,
		"up": up,
		"down": down
	});
	init();
}
})(jQuery);
