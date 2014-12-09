pg.Application = function(gameId, sessionId) {
	function init() {
		initConnection(con);
		$("#game-gen").click(function() {
			initGame();
		});
		$("#toggle-setting").click(function() {
			$("#game-setting-table").toggle();
		});
		$("#salesforce-entry").click(function() {
			//ToDo
			$(this).prop("disabled", true);
		});
		$("#heroku-entry").click(function() {
			//ToDo
			$(this).prop("disabled", true);
		});
		$gameStart.click(function() {
			$gameStart.hide();
			codingStart();
			stopWatch.start(new GameSetting().codingTime(), executeStart());
		});
	}
	function initConnection(con) {
		con.on("initGame", function(data) {
			console.log("initGame", data);
		});
		con.request({
			"command": "status",
			"success": function(data) {
				if (data.status) {
					updateStatus(data.status);
				} else {
					initGame();
				}
			}
		});
	}
	function initGame() {
		var setting = new GameSetting();
		game.reset(setting.fieldWidth(), setting.fieldHeight());
		generateObject(setting.wallCount(), Wall);
		generateObject(setting.wallCount(), Point);
		$.each(game.getPlayers(), function(idx, p) {
			var pos = randomPos(true);
			p.reset(pos.x, pos.y);
		});
		resetEditors();
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
				json.status.fields.push({
					"name": f.object().name(),
					"x": f.x,
					"y": f.y
				});
			}
		});
		con.request({
			"command": "initGame",
			"data": json
		});
	}
	function updateStatus(status) {
		function resetPlayerPos(player, pos) {
			player.reset(pos.x, pos.y);
		}
		var setting = new GameSetting();
		setting.update(status.setting);
		game.reset(setting.fieldWidth(), setting.fieldHeight());
		$.each(status.fields, function(idx, f) {
			if (f.name === "wall") {
				game.field(f.x, f.y).object(new Wall());
			} else if (f.name === "point") {
				game.field(f.x, f.y).object(new Point());
			}
		});
		resetPlayerPos(game.getSalesforce(), status.salesforce);
		resetPlayerPos(game.getHeroku(), status.heroku);
		resetPlayerPos(game.getBug(), status.bug);
	}
	function codingStart() {
		salesforceCtrl.codingStart();
		herokuCtrl.codingStart();
	}
	function executeStart() {
		
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
	function generateObject(cnt, Func) {
		for (var i=0; i<cnt; i++) {
			var pos = randomPos(false);
			game.field(pos.x, pos.y).object(new Func());
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
	var con = new room.Connection(location.protocol.replace("http", "ws") + location.host + "/ws/" + gameId),
		game = new Game($("#game")),
		salesforceCtrl = new SalesforceCtrl(game),
		herokuCtrl = new HerokuCtrl(game),
		stopWatch = new StopWatch($("#stopwatch")),
		$gameStart = $("#game-start");

	init();
};

