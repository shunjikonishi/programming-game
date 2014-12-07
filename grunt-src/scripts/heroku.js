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
	function codingStart() {
		editor.readOnly(false);
	}
	var editor = new TextEditor($("#heroku-editor"));
	init();
	$.extend(this, {
		"getEditor": getEditor,
		"codingStart": codingStart
	});
}