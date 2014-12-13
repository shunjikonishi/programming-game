if (typeof(pg) == "undefined") pg = {};

(function ($) {
"use strict";

var FIELD_SIZE = 50;

function showError(msg) {
	alert(msg);
}


pg.Application = function(gameId, sessionId) {
	function init() {
		initConnection(con);
		$("#toggle-setting").click(function() {
			$("#game-setting-table").toggle();
		});
		$("#bug-test").click(function() {
			game.bugTest(new GameSetting().gameTime());
		});
		$gameGen.click(function() {
			initGame();
		});
		$replay.click(function() {
			if (replays && replays.length > 0) {
				$replay.hide();
				game.replay(replays);
			}
		});
		$salesforceEntry.click(function() {
			entry("salesforce");
		});
		$herokuEntry.click(function() {
			entry("heroku");
		});
		$gameStart.click(function() {
			var setting = new GameSetting();
			$gameStart.hide();
			con.request({
				"command": "codingStart",
				"data": {
					"codingTime": setting.codingTime(),
					"gameTime": setting.gameTime(),
					"turnTime": setting.turnTime()
				}
			});
		});
	}
	function initConnection(con) {
		con.sendNoop(30);
		con.on("initGame", function(data) {
			updateStatus(data.status);
		});
		con.on("alert", function(data) {
			alert(data);
		});
		con.on("change", function(data) {
			var ctrl = data.name === "salesforce" ? salesforceCtrl : herokuCtrl;
			ctrl.getEditor().applyChange(data);
		});
		con.on("playerStatus", updatePlayerStatus);
		con.on("codingStart", codingStart);
		con.on("executeStart", executeStart);
		con.on("commandRequest", commandRequest);
		con.on("turnAction", game.turnAction);
		con.on("gameEnd", function(data) {
			salesforceCtrl.gameEnd();
			herokuCtrl.gameEnd();
			game.getSalesforce().entry(null);
			game.getHeroku().entry(null);
			replays = data;
			observers = [];
			updateButtons();
		});
		con.request({
			"command": "status",
			"success": function(data) {
				if (data.status) {
					updateStatus(data.status, data.replayData);
				} else {
					initGame();
					updateButtons();
				}
			}
		});
	}
	function initGame() {
		var setting = new GameSetting();
		game.reset(setting.fieldWidth(), setting.fieldHeight());
		generateObject(setting.wallCount(), false);
		generateObject(setting.wallCount(), true);
		$.each(game.getPlayers(), function(idx, p) {
			var pos = randomPos(true);
			p.reset(pos.x, pos.y);
		});
		var json = {
			"sessionId": sessionId,
			"status": {
				"setting": setting.toJson(),
				"salesforce": game.getSalesforce().toJson(),
				"heroku": game.getHeroku().toJson(),
				"bug": game.getBug().toJson(),
				"fields": []
			}
		};
		$.each(game.allFields(), function(idx, f) {
			if (f.hasObject()) {
				var obj = {
					"name": f.object().name(),
					"x": f.x,
					"y": f.y
				};
				if (obj.name === "point") {
					obj.point = f.object().point();
					if (f.object().pointVisible()) {
						obj.pointVisible = true;
					}
				}
				json.status.fields.push(obj);
			}
		});
		con.request({
			"command": "initGame",
			"data": json
		});
		replays = [];
		observers = [];
		updateButtons();
	}
	function updateStatus(status, replayData) {
		function resetPlayer(cp, sp) {
			cp.entry(sp.sessionId || null);
			cp.reset(sp.x, sp.y);
		}
		var setting = new GameSetting();
		setting.update(status.setting);
		game.reset(setting.fieldWidth(), setting.fieldHeight());
		$.each(status.fields, function(idx, f) {
			if (f.name === "wall") {
				game.field(f.x, f.y).object(new Wall());
			} else if (f.name === "point") {
				game.field(f.x, f.y).object(new Point(f.point, f.pointVisible || false));
			}
		});
		resetPlayer(game.getSalesforce(), status.salesforce);
		resetPlayer(game.getHeroku(), status.heroku);
		resetPlayer(game.getBug(), status.bug);
		replays = replayData || [];
		updateButtons();
	}
	function updatePlayerStatus(ps) {
		var player = game.getPlayer(ps.player);
		if (player) {
			player.entry(ps.sessionId);
		}
		updateButtons();
	}
	function entry(name) {
		con.request({
			"command": "entry",
			"data": {
				"player": name,
				"sessionId": sessionId
			}
		});
	}
	function updateButtons() {
		function updateEntryButton($btn, player) {
			$btn.prop("disabled", hasReplay || player.isEntried());
			if (player.getSessionId() === sessionId) {
				$btn.text(MSG.yourEntry);
			} else if (player.isEntried()) {
				$btn.text(MSG.entried);
			} else {
				$btn.text(MSG.entry);
			}
		}
		var s = game.getSalesforce(),
			h = game.getHeroku(),
			hasReplay = replays && replays.length > 0,
			entried = s.getSessionId() === sessionId || h.getSessionId() === sessionId,
			noEntry = !(s.isEntried() || h.isEntried());
		$gameGen.prop("disabled", !(entried || noEntry));
		$("#game-setting-table").find(":input").prop("disabled", !(entried || noEntry));
		$gameStart.toggle(!hasReplay);
		$gameStart.prop("disabled", !entried);
		$replay.toggle(hasReplay);
		$(".header-label").hide();
		updateEntryButton($salesforceEntry, s);
		updateEntryButton($herokuEntry, h);
		if (replays.length === 0) {
			resetEditors();
		}
	}
	function codingStart(setting) {
		$(".btn-test").prop("disabled", false);
		$gameStart.hide();
		if (stopWatch.isRunning()) {
			return;
		}
		$salesforceEntry.prop("disabled", true);
		$herokuEntry.prop("disabled", true);
		game.showMessage(MSG.codingStart);
		salesforceCtrl.codingStart();
		herokuCtrl.codingStart();
		stopWatch.start(setting.codingTime);
		observers = [];
	}
	function executeStart(data) {
		$(".btn-test").prop("disabled", true);
		game.showMessage(MSG.gameStart);
		game.start(data.gameTime);
		if (game.getSalesforce().getSessionId() === sessionId) {
			observers.push(new Observer("salesforce", con, game, game.getSalesforce(), salesforceCtrl.getEditor()));
		}
		if (game.getHeroku().getSessionId() === sessionId) {
			observers.push(new Observer("heroku", con, game, game.getHeroku(), herokuCtrl.getEditor()));
		}
	}
	function commandRequest() {
		$.each(observers, function(idx, observer) {
			observer.run();
		});
	}
	function random(n) {
		return Math.floor(Math.random() * n);
	}
	function randomPos(checkPlayerPos) {
		while (true) {
			var x = random(game.width),
				y = random(game.height),
				field = game.field(x, y);
			if (!field.hasObject() && (!checkPlayerPos || !game.hasPlayer(x, y))) {
				return {
					"x": x,
					"y": y
				};
			}
		}
	}
	function generateObject(cnt, isPoint) {
		var visible = cnt / 5;
		for (var i=0; i<cnt; i++) {
			var pos = randomPos(false),
				obj = null;
			if (isPoint) {
				var point = (random(3) + 1) * 10;
				obj = new Point(point, i >= visible);
			} else {
				obj = new Wall();
			}
			game.field(pos.x, pos.y).object(obj);
		}
	}
	function resetEditors() {
		$.each(game.getPlayers(), function(idx, p) {
			var pos = p.pos();
			if (p.isSalesforce()) {
				salesforceCtrl.getEditor().reset(pos.x, pos.y);
			} else if (p.isHeroku()) {
				herokuCtrl.getEditor().reset(pos.x, pos.y);
			}
		});
	}
	var con = new room.Connection({
			"url": location.protocol.replace("http", "ws") + "//" + location.host + "/ws/" + gameId,
			"logger": console
		}),
		game = new Game($("#game"), sessionId, con),
		salesforceCtrl = new SalesforceCtrl(game, con),
		herokuCtrl = new HerokuCtrl(game, con),
		stopWatch = new StopWatch($("#stopwatch")),
		watch = false,
		replays = [],
		observers = [],
		$gameGen = $("#game-gen"),
		$replay = $("#replay"),
		$salesforceEntry = $("#salesforce-entry"),
		$herokuEntry = $("#heroku-entry"),
		$gameStart = $("#game-start");

	init();
};


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
			resultDialog.win(winner);
			gameEnd();
		}
		function draw() {
			resultDialog.draw();
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
		var animate = new Animate(player.element()),
			pos = player.pos(),
			name = pos.x <= 0 || pos.y <= 0 ? "drop_left" : "drop_right";
		animate.show({
			"name": name,
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
				$("#turnlabel").hide();
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
		testCtrl = new TestControl(),
		resultDialog = new ResultDialog($("#result-dialog"));
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


function GameSetting() {
	function update(setting) {
		$.each(setting, function(key, value) {
			self[key](value);
		});
	}
	function toJson() {
		var ret = {};
		$.each(names, function(idx, name) {
			ret[name] = self[name]();
		});
		return ret;
	}
	var self = this,
		names = [
			"fieldWidth",
			"fieldHeight",
			"pointCount",
			"wallCount",
			"codingTime",
			"gameTime",
			"turnTime"
		];
	$.each(names, function(idx, name) {
		self[name] = (function() {
			return function(v) { 
				var $el = $("#" + name);
				if (v === undefined) {
					return parseInt($el.val(), 10);
				} else {
					$el.val(v);
				}
			};
		})();
	});
	$.extend(this, {
		"update": update,
		"toJson": toJson
	});
}
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
		$div.show();
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
		if (v) {
			new Animate($("#" + name() + "-entry-icon")).show({
				"name": "entry",
				"duration": "1s"
			});
		}
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
function Bug(game) {
	function canMove(x, y) {
		if (x < 0 || y < 0 || x >= game.width || y >= game.height) {
			return false;
		}
		var obj = game.field(x, y).object();
		return !obj || obj.canEnter();
	}
	function calcNextCommand(cnt) {
		var pos = self.__proto__.pos();
		switch(prevAction) {
			case "up":
				pos.y -= 1;
				break;
			case "right":
				pos.x += 1;
				break;
			case "down":
				pos.y += 1;
				break;
			case "left":
				pos.x -= 1;
				break;
		}
		if (cnt === 3 || canMove(pos.x, pos.y)) {
			return {
				"command": prevAction
			};
		}
		switch(prevAction) {
			case "up":
				prevAction = cnt === 0 ? "right" : cnt === 1 ? "down" : "left";
				break;
			case "right":
				prevAction = cnt === 0 ? "down" : cnt === 1 ? "left" : "up";
				break;
			case "down":
				prevAction = cnt === 0 ? "left" : cnt === 1 ? "up" : "right";
				break;
			case "left":
				prevAction = cnt === 0 ? "up" : cnt === 1 ? "right" : "down";
				break;
		}
		return calcNextCommand(cnt + 1);
	}
	function nextCommand() {
		return calcNextCommand(0);
	}
	function reset(nx, ny) {
		prevAction = "up";
		self.__proto__.reset(nx, ny);
	}
	function isBug() {
		return true;
	}
	var self = this,
		prevAction = "up";

	this.__proto__ = new Player("/assets/images/bug.png", -1, -1);
	$.extend(this, {
		"nextCommand": nextCommand,
		"reset": reset,
		"isBug": isBug
	});
}
function SalesforceCtrl(game, con) {
	function init() {
		$ins.click(function() {
			$ins.toggleClass("btn-success");
		});
		$("#salesforce-up").click(function() {
			setCommand("p.up();");
		});
		$("#salesforce-down").click(function() {
			setCommand("p.down();");
		});
		$("#salesforce-left").click(function() {
			setCommand("p.left();");
		});
		$("#salesforce-right").click(function() {
			setCommand("p.right();");
		});
		$("#salesforce-del").click(function() {
			editor.del();
		});
		$("#salesforce-undo").click(function() {
			editor.undo();
		});
		$("#salesforce-test").click(function() {
			var player = game.getSalesforce();
			game.test(player, editor.getCommands());
		});
		enableButtons(false);
	}
	function isInsertMode() {
		return $ins.hasClass("btn-success");
	}
	function setCommand(text) {
		editor.setCommand(text, isInsertMode());
	}
	function enableButtons(b) {
		$("#salesforce-buttons").find("button").prop("disabled", !b);
	}
	function codingStart() {
		var b = game.getSessionId() === game.getSalesforce().getSessionId();
		enableButtons(b);
		editor.setChangeHandling(b);
	}
	function gameEnd() {
		editor.setChangeHandling(false);
	}
	function getEditor() {
		return editor;
	}
	var editor = new TextEditor("salesforce", $("#salesforce-editor"), con),
		$ins = $("#salesforce-ins");
	init();
	$.extend(this, {
		"getEditor": getEditor,
		"codingStart": codingStart,
		"gameEnd": gameEnd
	});
}
function HerokuCtrl(game, con) {
	function init() {
		$("#heroku-test").click(function() {
			var player = game.getHeroku();
			game.test(player, editor.getCommands());
		});
	}
	function getEditor() {
		return editor;
	}
	function codingStart() {
		var b = game.getSessionId() === game.getHeroku().getSessionId();
		editor.readOnly(!b);
		editor.setChangeHandling(b);
		editor.focus();
	}
	function gameEnd() {
		editor.setChangeHandling(false);
	}
	var editor = new TextEditor("heroku", $("#heroku-editor"), con);
	init();
	$.extend(this, {
		"getEditor": getEditor,
		"codingStart": codingStart,
		"gameEnd": gameEnd
	});
}
function TextEditor(name, $textarea, con) {
	function autocomplete(cm) {
		var obj = cm.getTokenAt(cm.getCursor()).string;
		cm.replaceSelection(".");
		if (obj && obj.trim() === "p") {
			CodeMirror.showHint(cm, function() {
				return {
					"list": [
						"up()",
						"right()",
						"down()",
						"left()"
					],
					"from": cm.getCursor(),
					"to": cm.getCursor()
				};
			}, {
				"closeCharacters": /.*/
			});
		}
	}
	function createEditor() {
		var options = {
			"mode": "javascript",
			"lineNumbers": true,
			"firstLineNumber": 0,
			"readOnly": true,
			"styleActiveLine": true
		};
		if (name === "heroku") {
			$.extend(options, {
				"extraKeys": {
					".": autocomplete
				}
			});
		}
		return CodeMirror.fromTextArea($textarea[0], options);
	}
	function setReadOnly(line) {
		editor.markText({
			"line": line,
			"ch": 0
		}, {
			"line": line + 1,
			"ch": 0
		}, {
			"atomic": true,
			"readOnly": true
		});
		editor.addLineClass(line, "background", "editor-readonly");
		consumedLine = line;
	}
	function isReadOnly(line) {
		return line === 0;
	}
	function reset(x, y) {
		editor.markClean();
		editor.setValue("var p = new Player(" + x + ", " + y + ");\n");
		setReadOnly(0);
		editor.setSelection({
			"line": 1,
			"head": 0
		});
	}
	function consumeLine() {
		var line = consumedLine + 1,
			lineCount = editor.lineCount();
		if (line < lineCount) {
			var text = editor.getLine(line);
			setReadOnly(line);
			return text || "";
		}
		return null;
	}
	function setCommand(text, ins) {
		var line = editor.getCursor().line;
		if (isReadOnly(line)) {
			return;
		}
		var oldValue = editor.getLine(line);
		if (ins) {
			text += "\n" + oldValue;
		}
		if (line !== editor.lastLine()) {
			text += "\n";
		} else if (!ins) {
			text += "\n";
		}
		editor.replaceRange(text, {
			"line": line,
			"ch": 0
		}, {
			"line": line + 1,
			"ch": 0
		});
		if (ins) {
			editor.setSelection({
				"line": line + 1,
				"head": 0
			});
		}
	}
	function getCommands() {
		var ret = [];
		for (var i=1; i<editor.lineCount(); i++) {
			var str = editor.getLine(i);
			if (str) {
				ret.push(str);
			}
		}
		return ret;
	}
	function readOnly(v) {
		if (v === undefined) {
			return editor.getOption("readOnly");
		} else {
			editor.setOption("readOnly", v);
		}
	}
	function del() {
		var line = editor.getCursor().line;
		if (isReadOnly(line)) {
			return;
		}
		editor.replaceRange("", {
			"line": line,
			"ch": 0
		}, {
			"line": line + 1,
			"ch": 0
		});
	}
	function undo() {
		editor.undo();
	}
	function onChange(instance, change) {
		function isError(cmd) {
			if (cmd.error) {
				return true;
			}
			if (cmd.object !== "p") {
				return true;
			}
			var m = cmd.method;
			if (m !== "up" && m !== "down" && m !== "right" && m !== "left") {
				return true;
			}
			for (var i=0; i<cmd.args.length; i++) {
				if (!(/^\d+$/.test(cmd.args[i]))) {
					return true;
				}
			}
			return false;
		}
		var currentLine = instance.getCursor().line, 
			data = {
				"name": name,
				"from": {
					"line": change.from.line,
					"ch": change.from.ch
				},
				"to": {
					"line": change.to.line,
					"ch": change.to.ch
				},
				"text": change.text
			};
		for (var i=change.from.line; i<=change.to.line; i++) {
			var hasError = false;
			if (i !== currentLine) {
				var text = instance.getLine(i);
				if (text && text.trim().length > 0) {
					hasError = isError(parser.parse(text));
				}
				if (hasError) {
					editor.addLineClass(i, "background", "editor-error");
				} else {
					editor.removeLineClass(i, "background", "editor-error");
				}
			}
		}
		con.request({
			"command": "change",
			"data": data
		});
	}
	function setChangeHandling(b) {
		if (b) {
			editor.on("change", onChange);
		} else {
			editor.off("change", onChange);
		}
	}
	function applyChange(change) {
		editor.replaceRange(change.text.join("\n"), {
			"line": change.from.line,
			"ch": change.from.ch
		}, {
			"line": change.to.line,
			"ch": change.to.ch
		});
		editor.setSelection({
			"line": change.to.line,
			"ch": change.to.ch
		});
	}
	function focus() {
		editor.focus();
	}
	var consumedLine = 0,
		editor = createEditor(),
		parser = new Parser();
	$.extend(this, {
		"reset": reset,
		"setCommand": setCommand,
		"setChangeHandling": setChangeHandling,
		"applyChange": applyChange,
		"del": del,
		"undo": undo,
		"focus": focus,
		"getCommands": getCommands,
		"readOnly": readOnly,
		"consumeLine": consumeLine
	});
}
function Parser() {
	var STATE_OBJECT = 1,
		STATE_METHOD = 2,
		STATE_ARGS   = 3,
		STATE_END    = 4;
	function error(str) {
		return {
			"error": "Syntax error: " + str
		};
	}
	function skipWhitespace(str, pos) {
		while (pos < str.length) {
			var c = str.charAt(pos);
			if (c !== ' ' && c !== '\t' && c !== '\r' && c !== '\n') {
				return pos;
			}
			pos++;
		}
		return pos;
	}
	function isNumber(str) {
		return /^[-]?\d+(\.\d+)?$/.test(str);
	}
	function isValidArg(str) {
		return str === "true" || str === "false" || str === "null" || isNumber(str);
	}
	function convertArg(str) {
		switch (str) {
			case "true": return true;
			case "false": return false;
			case "null": return null;
			default: return Number(str);
		}
	}
	function parse(str) {
		var pos = skipWhitespace(str, 0),
			state = STATE_OBJECT,
			obj = null,
			method = null,
			args = [],
			buf = [],
			arg, n;
		while (pos < str.length) {
			var c = str.charAt(pos++);
			switch (c) {
				case '.':
					if (state === STATE_OBJECT) {
						obj = buf.join("");
						buf = [];
						state = STATE_METHOD;
					} else {
						return error(str);
					}
					break;
				case '(':
					if (state === STATE_METHOD) {
						method = buf.join("");
						buf = [];
						state = STATE_ARGS;
					} else {
						return error(str);
					}
					break;
				case '"':
				case "'":
					if (state === STATE_ARGS) {
						if (buf.length > 0) {
							return error(str);
						}
						n = str.indexOf(c, pos);
						if (n === -1) {
							return error(str);
						}
						args.push(str.substring(pos, n));
						pos = skipWhitespace(str, n + 1);
						if (str.charAt(pos) === ",") {
							pos = skipWhitespace(pos + 1);
						}
					} else {
						return error(str);
					}
					break;
				case ',':
					if (state === STATE_ARGS) {
						if (buf.length === 0) {
							return error(str);
						}
						arg = buf.join("");
						if (isValidArg(arg)) {
							args.push(convertArg(arg));
						} else {
							return error(str);
						}
						buf = [];
						pos = skipWhitespace(pos);
					} else {
						return error(str);
					}
					break;
				case ')':
					if (state === STATE_ARGS) {
						if (buf.length > 0) {
							arg = buf.join("");
							if (isValidArg(arg)) {
								args.push(convertArg(arg));
							} else {
								return error(str);
							}
							buf = [];
						}
						state = STATE_END;
					} else {
						return error(str);
					}
					break;
				case ';':
					if (state !== STATE_END) {
						return error(str);
					}
					break;
				default:
					if (state !== STATE_END) {
						buf.push(c);
					} else {
						return error(str);
					}
					break;
			}
		}
		if (state !== STATE_END) {
			return error(str);
		}
		return {
			"object": obj,
			"method": method,
			"args": args
		};
	}
	$.extend(this, {
		"parse": parse
	});
}
function Interpreter(context, parser) {
	function run(command) {
		if (typeof(command) === "string") {
			command = parser.parse(command);
		}
		if (command.error) {
			handleError(command.error);
			return;
		}
		var obj = context[command.object];
		if (!obj) {
			handleError("Object " + command.object + " is not defined.");
			return;
		}
		var method = obj[command.method];
		if (!method) {
			handleError("Method " + command.method + " is not defined.");
			return;
		}
		method.apply(obj, command.args);
	}
	function handleError(err) {
		if (context.onError) {
			context.onError(err);
		}
	}
	$.extend(this, {
		"run": run
	});
}
function StopWatch($el) {
	function show(rest) {
		var min = Math.floor(rest / 60),
			sec = rest % 60,
			text = ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2);
		$el.text(text);
	}
	function countDown() {
		var rest = Math.floor((limit - new Date().getTime()) / 1000);
		show(rest);
		if (rest > 0) {
			setTimeout(countDown, 1000);
		} else {
			running = false;
			$el.hide();
			if (callback) {
				callback();
			}
		}
	}
	function start(sec, func) {
		running = true;
		limit = new Date().getTime() + (sec * 1000);
		$el.show();
		callback = func;
		show(sec);
		setTimeout(countDown, 1000);
	}
	function hide() {
		$el.hide();
	}
	function isRunning() { 
		return running;
	}
	var limit = -1,
		callback = null,
		running = false;
	$.extend(this, {
		"start": start,
		"isRunning": isRunning,
		"hide": hide
	});
}
function Animate($el) {
	var properties = [
		"name",
		"iteration-count",
		"duration",
		"timing-function",
		"delay",
		"direction"
	], defaults = {
		"name" : "inout",
		"iteration-count" : 1,
		"duration" : "2s",
		"timing-function" : "ease",
		"delay" : "0s",
		"direction" : "normal"
	};
	function durationToMillis(value) {
		var idx1 = value.indexOf("ms"),
			idx2 = value.indexOf("s");
		if (idx1 !== -1) {
			value = value.substring(0, value.length - 2);
			return parseInt(value);
		} else if (idx2 !== -1) {
			value = value.substring(0, value.length - 1);
		}
		return parseInt(value) * 1000;

	}
	function show(options) {
		if (typeof(options) === "string") {
			options = {
				"message": options
			};
		}
		if (shown) {
			queue.push(options);
			return;
		}
		shown = true;
		var params = {},
			visible = $el.is(":visible"),
			msg = options.message;
		for (var i=0; i<properties.length; i++) {
			var name = properties[i],
				value = null;
			if (options[name]) {
				value = options[name];
			} else if (initials[name]) {
				value = initials[name];
			} else {
				value = defaults[name];
			}
			params["animation-" + name] = value;
			params["-webkit-animation-" + name] = value;
		}
		if (msg) {
			$el.find(".message").text(msg);
		}
		$el.css(params);
		$el.show();
		setTimeout(function() {
			if (!visible) {
				$el.hide();
			}
			$el.css("animation-name", "");
			$el.css("-webkit-animation-name", "");
			if (initialText) {
				$el.find(".message").text(initialText);
			}
			shown = false;
			if (queue.length > 0) {
				var next = queue.shift();
				setTimeout(function() {
					show(next);
				}, 10);
			}
		}, durationToMillis(params["animation-duration"]));
	}
	function reset() {
		$el.css("animation-name", "");
		$el.css("-webkit-animation-name", "");
		$el.show();
	}
	function element() {
		return $el;
	}
	var initials = {},
		initialText = $el.find(".message").text(),
		shown = false,
		queue = [];
	for (var i=0; i<properties.length; i++) {
		var name = properties[i],
			value = $el.css("animation-" + name);
		if (value && value !== "none" && value !== "0s") {
			initials[name] = value;
		}
	}
	$.extend(this, {
		"show" : show,
		"element": element,
		"reset": reset
	});
}
function ResultDialog($el) {
	function show(name) {
		$el.find("img").attr("src", "/assets/images/illust/" + name + ".png");
		setTimeout(function() {
			$el.modal({
				"show": true
			});
		}, 800);
	}
	function win(name) {
		$el.find(".modal-title").text(MSG.format(MSG.win, name));
		show("win-" + name.toLowerCase());
	}
	function draw() {
		$el.find(".modal-title").text(MSG.draw);
		show("draw");
	}
	$.extend(this, {
		"win": win,
		"draw": draw
	});
}
function Observer(name, con, game, player, editor) {
	function run() {
		if (!game.isRunning()) {
			return;
		}
		if (player.commandCount() === 0) {
			var text = editor.consumeLine();
			if (text) {
				interpreter.run(text);
			}
		}
		var cmd = player.commandCount() > 0 ? player.nextCommand() : {
			"command": "wait"
		};
		con.request({
			"command": "playerAction",
			"data": {
				"player": name,
				"action": cmd
			}
		});
	}
	var context = {
		"p": player,
		"onError": function(msg) {
			console.log(msg);
			player.wait();
		}
	}, interpreter = new Interpreter(context, new Parser());
	$.extend(this, {
		"run": run
	});
}
})(jQuery);
