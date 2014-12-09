function GameSetting() {
	var self = this,
		names = [
			"fieldWidth",
			"fieldHeight",
			"pointCount",
			"wallCount",
			"codingTime",
			"gameTime"
		];
	$.each(names, function(idx, name) {
		self[name] = (function() {
			return function() { return $("#" + name).val();};
		})();
	});
}