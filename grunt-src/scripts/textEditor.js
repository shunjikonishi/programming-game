function TextEditor(name, $textarea, con) {
	function setReadOnly(line) {
		editor.markText({
			"line": line,
			"ch": 0
		}, {
			"line": line + 1,
			"ch": 0
		}, {
			"atomic": true,
			"readOnly": true
		});
		editor.addLineClass(line, "background", "editor-readonly");
	}
	function isReadOnly(line) {
		return line === 0;
	}
	function reset(x, y) {
		editor.markClean();
		editor.setValue("var p = new Player(" + x + ", " + y + ");\n");
		setReadOnly(0);
		editor.setSelection({
			"line": 1,
			"head": 0
		});
	}
	function setCommand(text, ins) {
		var line = editor.getCursor().line;
		if (isReadOnly(line)) {
			return;
		}
		var oldValue = editor.getLine(line);
		if (ins) {
			text += "\n" + oldValue;
		}
		if (line !== editor.lastLine()) {
			text += "\n";
		} else if (!ins) {
			text += "\n";
		}
		editor.replaceRange(text, {
			"line": line,
			"ch": 0
		}, {
			"line": line + 1,
			"ch": 0
		});
		if (ins) {
			editor.setSelection({
				"line": line + 1,
				"head": 0
			});
		}
	}
	function getCommands() {
		var ret = [];
		for (var i=1; i<editor.lineCount(); i++) {
			var str = editor.getLine(i);
			if (str) {
				ret.push(str);
			}
		}
		return ret;
	}
	function readOnly(v) {
		if (v === undefined) {
			return editor.getOption("readOnly");
		} else {
			editor.setOption("readOnly", v);
		}
	}
	function del() {
		var line = editor.getCursor().line;
		if (isReadOnly(line)) {
			return;
		}
		editor.replaceRange("", {
			"line": line,
			"ch": 0
		}, {
			"line": line + 1,
			"ch": 0
		});
	}
	function undo() {
		editor.undo();
	}
	function onChange(instance, change) {
		console.log("onChange", change);
		var data = {
			"name": name,
			"from": {
				"line": change.from.line,
				"ch": change.from.ch
			},
			"to": {
				"line": change.to.line,
				"ch": change.to.ch
			},
			"text": change.text
		};
		con.request({
			"command": "change",
			"data": data
		});
	}
	function setChangeHandling(b) {
		if (b) {
			editor.on("change", onChange);
		} else {
			editor.off("change", onChange);
		}
	}
	function applyChange(change) {
		editor.replaceRange(change.text.join("\n"), {
			"line": change.from.line,
			"ch": change.from.ch
		}, {
			"line": change.to.line,
			"ch": change.to.ch
		});
		editor.setSelection({
			"line": change.to.line,
			"ch": change.to.ch
		});
	}
	var editor = CodeMirror.fromTextArea($textarea[0], {
		"mode": "javascript",
		"lineNumbers": true,
		"readOnly": true,
		"styleActiveLine": true
	});
	$.extend(this, {
		"reset": reset,
		"setCommand": setCommand,
		"setChangeHandling": setChangeHandling,
		"applyChange": applyChange,
		"del": del,
		"undo": undo,
		"getCommands": getCommands,
		"readOnly": readOnly
	});
}