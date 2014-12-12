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