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
			resetEditors();
		}).click();
		$("#toggle-setting").click(function() {
			$("#game-setting-table").toggle();
		});
		$("#salesforce-entry").click(function() {
			if (game.isSalesforceEntried()) {
				return;
			}
			entry("/assets/images/salesforce.png");
			$(this).prop("disabled", true);
		});
		$("#heroku-entry").click(function() {
			if (game.isHerokuEntried()) {
				return;
			}
			entry("/assets/images/heroku.png");
			$(this).prop("disabled", true);
		});
		$gameStart.click(function() {
			$gameStart.hide();
			codingStart();
			stopWatch.start(new GameSetting().codingTime(), executeStart());
		});

		//For test
		$("#salesforce-entry").click();
		$("#heroku-entry").click();
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
		resetEditors();
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
	var game = new Game($("#game")),
		salesforceCtrl = new SalesforceCtrl(game),
		herokuCtrl = new HerokuCtrl(game),
		stopWatch = new StopWatch($("#stopwatch")),
		$gameStart = $("#game-start");

	init();
};

