function Game($el, sessionId, con) {
	function TestControl() {
		function isRunning() {
			return players.length > 0;
		}
		function isPlayerRunning(p) {
			return indexOf(p) !== -1;
		}
		function indexOf(p) {
			for (var i=0; i<players.length; i++) {
				if (players[i].name() === p.name()) {
					return i;
				}
			}
			return -1;
		}
		function start(p) {
			players.push(p);
		}
		function finish(p) {
			var idx = indexOf(p);
			if (idx !== -1) {
				players.splice(idx, 1);
			}
			if (players.length === 0) {
				abortFlag = false;
			}
		}
		function isAbort() {
			return abortFlag;
		}
		function abort() {
			abortFlag = true;
		}
		var players = [],
			abortFlag = false;
		$.extend(this, {
			"isRunning": isRunning,
			"isPlayerRunning": isPlayerRunning,
			"start": start,
			"finish": finish,
			"abort": abort,
			"isAbort": isAbort
		});
	}
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
	function createPlayer(imageSrc, pointDiv) {
		var ret = new Player(imageSrc, -1, -1, $(pointDiv));
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
			player.pos(pos.x, pos.y);
			return false;
		}
		if (!wait) {
			var obj = field(pos.x, pos.y).object();
			if (obj) {
				if (!obj.canEnter()) {
					wait = true;
				}
			} 
		}
		if (!wait) {
			player.pos(pos.x, pos.y);
		}
		return true;
	}
	function turnAction(data, replay) {
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
				if (same(p1_1, p1_2)) {
					return {
						"x": (p1_2.x + p2_1.x) / 2,
						"y": (p1_2.y + p2_1.y) / 2
					};
				} else if (same(p2_1, p2_2)) {
					return {
						"x": (p1_1.x + p2_2.x) / 2,
						"y": (p1_1.y + p2_2.y) / 2
					};
				} else {
					return {
						"x": p1_2.x,
						"y": p1_2.y
					};
				}
			}
			return null;
		}
		function gameEnd() {
			running = false;
			if (!replay) {
				con.request({
					"command": "gameEnd"
				});
			}
		}
		function gameover(winner) {
			showMessage({
				"message": MSG.format(MSG.win, winner),
				"duration": "4s"
			}, winner.toLowerCase());
			gameEnd();
		}
		function draw() {
			showMessage({
				"message": MSG.draw,
				"duration": "4s"
			});
			gameEnd();
		}
		function showConflict(pos) {
			var $conflict = $("#conflict").show();
			$conflict.css({
				"left": pos.x * 50,
				"top": pos.y * 50
			});
			setTimeout(function() {
				$conflict.hide();
			}, 100);
		}
		function checkPoint(player) {
			var pos = player.pos(),
				obj = field(pos.x, pos.y).object();
			if (obj && obj.visible() && obj.name() === "point") {
				player.addPoint(obj.point());
				obj.visible(false);
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
			drop(salesforce, function() {
				salesforce.element().hide();
			});
			sOut = true;
		}
		if (!runCommand(heroku, data.heroku)) {
			drop(heroku, function() {
				heroku.element().hide();
			});
			hOut = true;
		}
		runCommand(bug, bug.nextCommand());
		var spos2 = salesforce.pos(),
			hpos2 = heroku.pos(),
			bpos2 = bug.pos();
		if (conflict(spos1, spos2, bpos1, bpos2)) {
			bug.pos(spos2.x, spos2.y);
			sOut = true;
		}
		if (conflict(hpos1, hpos2, bpos1, bpos2)) {
			bug.pos(hpos2.x, hpos2.y);
			hOut = true;
		}
		if (!sOut && !hOut) {
			var cpos = conflict(spos1, spos2, hpos1, hpos2);
			if (cpos) {
				salesforce.pos(spos1.x, spos1.y);
				heroku.pos(hpos1.x, hpos1.y);
				showConflict(cpos);
				if (same(spos1, bpos2)) {
					sOut = true;
				}
				if (same(hpos1, bpos2)) {
					hOut = true;
				}
			}
		}
		if (!sOut) {
			checkPoint(salesforce);
		}
		if (!hOut) {
			checkPoint(heroku);
		}
		currentTurn++;
		showTurnLabel();
		if (sOut && hOut) {
			draw();
		} else if (sOut) {
			gameover("Heroku");
		} else if (hOut) {
			gameover("Salesforce");
		} else if (currentTurn >= turnCount) {
			if (salesforce.getPoint() > heroku.getPoint()) {
				gameover("Salesforce");
			} else if (salesforce.getPoint() < heroku.getPoint()) {
				gameover("Heroku");
			} else {
				draw();
			}
		}
	}
	function drop(player, callback) {
		var animate = new Animate(player.element());
		animate.show({
			"name": "drop",
			"duration": "2s"
		});
		setTimeout(function() {
			animate.reset();
			callback();
		}, 2000);
	}
	function showObjects(b) {
		$.each(allFields(), function(idx, f) {
			if (f.object()) {
				f.object().visible(b);
			}
		});
	}
	function test(player, commands) {
		function gameover() {
			testCtrl.finish(player);
			player.reset();
			showObjects(true);
		}
		function run() {
			setTimeout(function() {
				if (testCtrl.isAbort()) {
					gameover();
					start(turnCount);
					return;
				}
				if (player.commandCount() > 0) {
					if (runCommand(player, player.nextCommand())) {
						run();
					} else {
						drop(player, gameover);
					}
				} else {
					gameover();
				}
			}, 200);
		}
		if (testCtrl.isPlayerRunning(player)) {
			return;
		}
		testCtrl.start(player);
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
		function gameover() {
			bug.reset();
			testCtrl.finish(bug);
		}
		function run() {
			setTimeout(function() {
				if (testCtrl.isAbort()) {
					gameover();
					start(turnCount);
					return;
				}
				if (cnt > 0) {
					runCommand(bug, bug.nextCommand());
					run();
				} else {
					gameover();
				}
				cnt--;
			}, 200);
		}
		if (testCtrl.isPlayerRunning(bug)) {
			return;
		}
		testCtrl.start(bug);
		run();
	}
	function start(gameTime) {
		turnCount = gameTime;
		currentTurn = 0;
		if (testCtrl.isRunning()) {
			testCtrl.abort();
			return;
		}
		running = true;
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
	function replay(commands) {
		function run() {
			turnAction(commands[idx++], true);
			if (idx < commands.length) {
				setTimeout(run, 400);
			} else {
				$("#replay").show();
				$("#turnLabel").hide();
			}
		}
		var idx = 0;
		salesforce.reset();
		heroku.reset();
		bug.reset();
		showObjects(true);
		start(commands.length);
		setTimeout(run, 400);
	}
	var self = this,
		fields = [],
		salesforce = createPlayer("/assets/images/salesforce.png", "#salesforce-point"),
		heroku = createPlayer("/assets/images/heroku.png", "#heroku-point"),
		bug = new Bug(this),
		animate = new Animate($("#message-dialog")),
		running = false,
		turnCount = -1,
		currentTurn = -1,
		testCtrl = new TestControl();
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
		"turnAction": turnAction,
		"replay": replay
	});
}

