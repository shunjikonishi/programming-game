function SalesforceCtrl(game, con) {
	function init() {
		$ins.click(function() {
			$ins.toggleClass("btn-success");
		});
		$("#salesforce-up").click(function() {
			setCommand("p.up();");
		});
		$("#salesforce-down").click(function() {
			setCommand("p.down();");
		});
		$("#salesforce-left").click(function() {
			setCommand("p.left();");
		});
		$("#salesforce-right").click(function() {
			setCommand("p.right();");
		});
		$("#salesforce-del").click(function() {
			editor.del();
		});
		$("#salesforce-undo").click(function() {
			editor.undo();
		});
		$("#salesforce-test").click(function() {
			var player = game.getSalesforce();
			game.test(player, editor.getCommands());
		});
		enableButtons(false);
	}
	function isInsertMode() {
		return $ins.hasClass("btn-success");
	}
	function setCommand(text) {
		editor.setCommand(text, isInsertMode());
	}
	function enableButtons(b) {
		$("#salesforce-buttons").find("button").prop("disabled", !b);
	}
	function codingStart() {
		var b = game.getSessionId() === game.getSalesforce().getSessionId();
		enableButtons(b);
		editor.setChangeHandling(b);
	}
	function getEditor() {
		return editor;
	}
	var editor = new TextEditor("salesforce", $("#salesforce-editor"), con),
		$ins = $("#salesforce-ins");
	init();
	$.extend(this, {
		"getEditor": getEditor,
		"codingStart": codingStart
	});
}