function Game($el, sessionId) {
	function reset(width, height) {
		self.width = width;
		self.height = height;
		$el.find(".field").remove();
		fields = [];
		$el.width(width * FIELD_SIZE);
		$el.height(height * FIELD_SIZE);
		for (var y=0; y<height; y++) {
			var line = [];
			fields.push(line);
			for (var x=0; x<width; x++) {
				var $field = $("<div class='field'/>");
				$el.append($field);
				line.push(new Field($field, x, y));
			}
		}
		$.each(getPlayers(), function(idx, player) {
			player.reset(-1, -1);
		});
	}
	function field(x, y) {
		return fields[y][x];
	}
	function allFields() {
		var ret = [];
		for (var y=0; y<fields.length; y++) {
			var line = fields[y];
			for (var x=0; x<line.length; x++) {
				ret.push(line[x]);
			}
		}
		return ret;
	}
	function getSessionId() {
		return sessionId;
	}
	function hasPlayer(x, y) {
		var players = getPlayers();
		for (var i=0; i<players.length; i++) {
			var pos =players[i].pos();
			if (pos.x === x && pos.y === y) {
				return true;
			}
		}
		return false;
	}
	function createPlayer(imageSrc) {
		var ret = new Player(imageSrc, -1, -1);
		$el.append(ret.element());
		return ret;
	}
	function getPlayers() {
		var ret = [];
		ret.push(salesforce);
		ret.push(heroku);
		ret.push(bug);
		return ret;
	}
	function getSalesforce() {
		return salesforce;
	}
	function getHeroku() {
		return heroku;
	}
	function getBug() {
		return bug;
	}
	function getPlayer(name) {
		switch (name) {
			case "salesforce": return salesforce;
			case "heroku": return heroku;
			case "bug": return bug;
		}
		throw "Invaid name: " + name;
	}
	function runCommand(player, command) {
		var pos = player.pos(),
			end = false,
			wait = false;
		switch (command.command) {
			case "up":
				pos.y -= 1;
				if (pos.y < 0) {
					end = true;
				}
				break;
			case "down":
				pos.y += 1;
				if (pos.y >= self.height) {
					end = true;
				}
				break;
			case "left":
				pos.x -= 1;
				if (pos.x < 0) {
					end = true;
				}
				break;
			case "right":
				pos.x += 1;
				if (pos.x >= self.width) {
					end = true;
				}
				break;
			case "wait":
				wait = true;
				break;
		}
		if (end) {
			gameover(player, pos.x, pos.y);
			return;
		}
		if (!wait) {
			var obj = field(pos.x, pos.y).object();
			if (obj) {
				if (obj.canEnter()) {
					if (!player.isBug()) {
						obj.visible(false);
					}
				} else {
					wait = true;
				}
			} 
		}
		if (!wait) {
			player.pos(pos.x, pos.y);
		}
	}
	function gameover(player, x, y) {
		player.reset();
	}
	function test(player, commands) {
		function run() {
			setTimeout(function() {
				if (player.commandCount() > 0) {
					runCommand(player, player.nextCommand());
					run();
				} else {
					player.reset();
					$.each(allFields(), function(idx, f) {
						if (f.object()) {
							f.object().visible(true);
						}
					});
				}
			}, 200);
		}
		var context = {
			"p": player,
			"onError": function(msg) {
				console.log(msg);
				player.wait();
			}
		}, interpreter = new Interpreter(context, new Parser());
		$.each(commands, function(idx, cmd) {
			interpreter.run(cmd);
		});
		run();
	}
	function bugTest(cnt) {
		function run() {
			setTimeout(function() {
console.log("bugTest", cnt);
				if (cnt > 0) {
					runCommand(bug, bug.nextCommand());
					run();
				} else {
					bug.reset();
				}
				cnt--;
			}, 200);
		}
		run();
	}
	var self = this,
		fields = [],
		salesforce = createPlayer("/assets/images/salesforce.png"),
		heroku = createPlayer("/assets/images/heroku.png"),
		bug = new Bug(this);
	$el.append(bug.element());
	$.extend(this, {
		"field": field,
		"allFields": allFields,
		"reset": reset,
		"getPlayers": getPlayers,
		"hasPlayer": hasPlayer,
		"getPlayer": getPlayer,
		"getSalesforce": getSalesforce,
		"getHeroku": getHeroku,
		"getBug": getBug,
		"getSessionId": getSessionId,
		"test": test,
		"bugTest": bugTest
	});
}

