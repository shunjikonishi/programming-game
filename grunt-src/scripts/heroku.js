function HerokuCtrl(game) {
	function init() {
		$("#heroku-test").click(function() {
			var player = game.getHerokuPlayer();
			game.test(player, editor.getCommands());
		});
	}
	function getEditor() {
		return editor;
	}
	var editor = new TextEditor($("#heroku-editor"), false);
	init();
	$.extend(this, {
		"getEditor": getEditor
	});
}