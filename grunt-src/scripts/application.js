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