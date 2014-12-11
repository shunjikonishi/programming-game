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
			return false;
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
		return true;
	}
	function turnAction(data) {
		function same(p1, p2) {
			return p1.x === p2.x && p1.y === p2.y;
		}
		function conflict(p1_1, p1_2, p2_1, p2_2) {
			if (same(p1_1, p2_2) && same(p1_2, p2_1)) {
				return {
					"x": (p1_2.x + p2_2.x) / 2,
					"y": (p1_2.y + p2_2.y) / 2
				};
			}
			if (same(p1_2, p2_2)) {
				return {
					"x": p1_2.x,
					"y": p1_2.y
				};
			}
			return null;
		}
		function gameover(winner) {
			running = false;
			if (winner) {
				showMessage({
					"message": MSG.format(MSG.win, winner),
					"duration": "4s"
				}, winner.toLowerCase());
			} else {
				showMessage({
					"message": MSG.draw,
					"duration": "4s"
				});
			}
		}
		if (!running) {
			return;
		}
		var sOut = false,
			hOut = false,
			spos1 = salesforce.pos(),
			hpos1 = heroku.pos(),
			bpos1 = bug.pos();
		if (!runCommand(salesforce, data.salesforce)) {
			sOut = true;
		}
		if (!runCommand(heroku, data.heroku)) {
			hOut = true;
		}
		runCommand(bug, bug.nextCommand());
		var spos2 = salesforce.pos(),
			hpos2 = heroku.pos(),
			bpos2 = bug.pos();
		if (conflict(spos1, spos2, bpos1, bpos2)) {
			sOut = true;
		}
		if (conflict(hpos1, hpos2, bpos1, bpos2)) {
			hOut = true;
		}
		if (!sOut && !hOut) {
			if (conflict(spos1, spos2, hpos1, hpos2)) {
				salesforce.pos(spos1.x, spos1.y);
				heroku.pos(hpos1.x, hpos1.y);
				if (same(spos1, bpos2)) {
					sOut = true;
				}
				if (same(hpos1, bpos2)) {
					hOut = true;
				}
			}
		}
		currentTurn++;
		showTurnLabel();
		if (sOut && hOut) {
			gameover();
		} else if (sOut) {
			gameover("Heroku");
		} else if (hOut) {
			gameover("Salesforce");
		} else if (currentTurn >= turnCount) {
			gameover();
		}
	}
	function test(player, commands) {
		function gameover() {
			player.reset();
			$.each(allFields(), function(idx, f) {
				if (f.object()) {
					f.object().visible(true);
				}
			});
		}
		function run() {
			setTimeout(function() {
				if (player.commandCount() > 0) {
					if (runCommand(player, player.nextCommand())) {
						run();
					} else {
						gameover();
					}
				} else {
					gameover();
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
	function start(gameTime) {
		running = true;
		turnCount = gameTime;
		currentTurn = 0;
		showTurnLabel();
	}
	function isRunning() {
		return running;
	}
	function showTurnLabel() {
		$("#turnlabel").text(currentTurn + "/" + turnCount).show();
	}
	function showMessage(options, icon) {
		if (typeof(options) === "string") {
			options = {
				"message": options
			};
		}
		animate.element().find("img").hide();
		if (icon) {
			animate.element().find("." + icon).show();
		}
		animate.show(options);
	}
	var self = this,
		fields = [],
		salesforce = createPlayer("/assets/images/salesforce.png"),
		heroku = createPlayer("/assets/images/heroku.png"),
		bug = new Bug(this),
		animate = new Animate($("#message-dialog")),
		running = false,
		turnCount = -1,
		currentTurn = -1;
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
		"bugTest": bugTest,
		"showMessage": showMessage,
		"start": start,
		"isRunning": isRunning,
		"turnAction": turnAction
	});
}

