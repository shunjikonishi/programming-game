pg.Application = function(id) {
	function random(n) {
		return Math.floor(Math.random() * n);
	}
	function generateObject(cnt, Func) {
		while (cnt > 0) {
			var x = random(game.width),
				y = random(game.height),
				field = game.field(x, y);
			if (!field.hasObject()) {
				field.object(new Func());
				cnt--;
			}
		}
	}
	function entry(imageSrc) {
		if (!game) {
			return;
		}
		while (true) {
			var x = random(game.width),
				y = random(game.height),
				field = game.field(x, y);
			if (!field.hasObject()) {
				game.addPlayer(new Player(imageSrc, x, y));
				return;
			}
		}
	}
	var game = null;
	$("#game-gen").click(function() {
		if (game != null) {
			return;
		}
		var setting = new GameSetting();

		game = new Game($("#game"), setting.fieldWidth(), setting.fieldHeight());
		generateObject(setting.wallCount(), Wall);
		generateObject(setting.wallCount(), Point);
		$(this).prop("disabled", true);
	});
	$("#salesforce-entry").click(function() {
		entry("/assets/images/salesforce.jpg");
		$(this).prop("disabled", true);
	});
	$("#heroku-entry").click(function() {
		entry("/assets/images/heroku.png");
		$(this).prop("disabled", true);
	});
};

function GameSetting() {
	this.fieldWidth = function() { return $("#field-width").val();};
	this.fieldHeight = function() { return $("#field-height").val();};
	this.pointCount = function() { return $("#point-count").val();};
	this.wallCount = function() { return $("#wall-count").val();};
}