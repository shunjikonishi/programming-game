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
	function save() {
		if (localStorage) {
			localStorage.setItem("game-setting", JSON.stringify(toJson()));
		}
	}
	function load() {
		if (localStorage) {
			var str = localStorage.getItem("game-setting");
			if (str) {
				update(JSON.parse(str));
			}
		}
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
		"toJson": toJson,
		"save": save,
		"load": load
	});
}