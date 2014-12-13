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