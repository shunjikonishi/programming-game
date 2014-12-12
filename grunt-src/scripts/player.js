function Player(imageSrc, initialX, initialY, $point) {
	function init() {
		var $img = $("<img/>");
		$img.attr("src", imageSrc);
		$div.append($img);
		$div.addClass("player");
		reset(initialX, initialY);
	}
	function name() {
		return isSalesforce() ? "salesforce" : isHeroku() ? "heroku" : "bug";
	}
	function isSalesforce() {
		return imageSrc.indexOf("salesforce") !== -1;
	}
	function isHeroku() {
		return imageSrc.indexOf("heroku") !== -1;
	}
	function isBug() {
		return false;
	}
	function element() {
		return $div;
	}
	function reset(nx, ny) {
		point = 0;
		commands = [];
		if (nx !== undefined) {
			initialX = nx;
		}
		if (ny !== undefined) {
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
		if (arguments.length === 0) {
			return {
				"x": x,
				"y": y
			};
		}
		x = nx;
		y = ny;
		var left = x * FIELD_SIZE,
			top = y * FIELD_SIZE;
		$div.css({
			"left": left,
			"top": top
		});
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
					"command": command
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
	function entry(v) {
		sessionId = v;
	}
	function isEntried() {
		return !!sessionId;
	}
	function getSessionId() {
		return sessionId;
	}
	function toJson() {
		var ret = {
			"x": x,
			"y": y
		};
		if (sessionId) {
			ret.sessionId = sessionId;
		}
		return ret;
	}
	function getPoint() { 
		return point;
	}
	function addPoint(n) {
		point += n;
		if ($point) {
			$point.text(point);
		}
	}
	var x, y,
		$div = $("<div/>"),
		sessionId = null,
		commands = [],
		point = 0;

	$.extend(this, {
		"name": name,
		"element": element,
		"isSalesforce": isSalesforce,
		"isHeroku": isHeroku,
		"isBug": isBug,
		"nextCommand": nextCommand,
		"commandCount": commandCount,
		"reset": reset,
		"pos": pos,
		"wait": wait,
		"left": left,
		"right": right,
		"up": up,
		"down": down,
		"getSessionId": getSessionId,
		"entry": entry,
		"isEntried": isEntried,
		"toJson": toJson,
		"getPoint": getPoint,
		"addPoint": addPoint
	});
	init();
}