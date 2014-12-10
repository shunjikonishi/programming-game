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