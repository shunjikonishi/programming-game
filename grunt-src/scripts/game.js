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
	function getPlayer(method) {
		var ret = null;
		$.each(players,function(idx, p) {
			if (p[method]()) {
				ret = p;
			}
		});
		return ret;
	}
	function isSalesforceEntried() {
		return !!getPlayer("isSalesforce");
	}
	function isHerokuEntried() {
		return !!getPlayer("isHeroku");
	}
	function getSalesforcePlayer() {
		return getPlayer("isSalesforce");
	}
	function getHerokuPlayer() {
		return getPlayer("isHeroku");
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
					obj.visible(false);
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
	var self = this,
		fields = [],
		players = [];
	$.extend(this, {
		"field": field,
		"addPlayer": addPlayer,
		"reset": reset,
		"getPlayers": getPlayers,
		"getSalesforcePlayer": getSalesforcePlayer,
		"getHerokuPlayer": getHerokuPlayer,
		"isSalesforceEntried": isSalesforceEntried,
		"isHerokuEntried": isHerokuEntried,
		"test": test
	});
}

