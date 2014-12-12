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
					"gameTime": setting.gameTime()
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
		con.on("turnAction", game.turnAction);
		con.on("gameEnd", function(data) {
			salesforceCtrl.gameEnd();
			herokuCtrl.gameEnd();
			game.getSalesforce().entry(null);
			game.getHeroku().entry(null);
			replays = data;
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
		if (replayData && replayData.length > 0) {
			replays = replayData;
		}
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
		resetEditors();
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
		stopWatch.start(setting.codingTime, function() {
			executeStart(setting.gameTime);
		});
	}
	function executeStart(gameTime) {
		$(".btn-test").prop("disabled", true);
		game.showMessage(MSG.gameStart);
		game.start(gameTime);
		if (game.getSalesforce().getSessionId() === sessionId) {
			observe("salesforce", game.getSalesforce(), salesforceCtrl.getEditor());
		}
		if (game.getHeroku().getSessionId() === sessionId) {
			observe("heroku", game.getHeroku(), herokuCtrl.getEditor());
		}
	}
	function observe(name, player, editor) {
		function doObserve() {
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
			setTimeout(doObserve, 700);
		}
		var context = {
			"p": player,
			"onError": function(msg) {
				console.log(msg);
				player.wait();
			}
		}, interpreter = new Interpreter(context, new Parser());
		setTimeout(doObserve, 3000);
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
	var con = new room.Connection(location.protocol.replace("http", "ws") + "//" + location.host + "/ws/" + gameId),
		game = new Game($("#game"), sessionId, con),
		salesforceCtrl = new SalesforceCtrl(game, con),
		herokuCtrl = new HerokuCtrl(game, con),
		stopWatch = new StopWatch($("#stopwatch")),
		watch = false,
		replays = [],
		$gameGen = $("#game-gen"),
		$replay = $("#replay"),
		$salesforceEntry = $("#salesforce-entry"),
		$herokuEntry = $("#heroku-entry"),
		$gameStart = $("#game-start");

	init();
};

