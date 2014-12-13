function TextEditor(name, $textarea, con) {
	function autocomplete(cm) {
		var obj = cm.getTokenAt(cm.getCursor()).string;
		cm.replaceSelection(".");
		if (obj && obj.trim() === "p") {
			CodeMirror.showHint(cm, function() {
				return {
					"list": [
						"up()",
						"right()",
						"down()",
						"left()"
					],
					"from": cm.getCursor(),
					"to": cm.getCursor()
				};
			}, {
				"closeCharacters": /.*/
			});
		}
	}
	function createEditor() {
		var options = {
			"mode": "javascript",
			"lineNumbers": true,
			"firstLineNumber": 0,
			"readOnly": true,
			"styleActiveLine": true
		};
		if (name === "heroku") {
			$.extend(options, {
				"extraKeys": {
					".": autocomplete
				}
			});
		}
		return CodeMirror.fromTextArea($textarea[0], options);
	}
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
		consumedLine = line;
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
	function consumeLine() {
		var line = consumedLine + 1,
			lineCount = editor.lineCount();
		if (line < lineCount) {
			var text = editor.getLine(line);
			setReadOnly(line);
			return text || "";
		}
		return null;
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
		function isError(cmd) {
			if (cmd.error) {
				return true;
			}
			if (cmd.object !== "p") {
				return true;
			}
			var m = cmd.method;
			if (m !== "up" && m !== "down" && m !== "right" && m !== "left") {
				return true;
			}
			for (var i=0; i<cmd.args.length; i++) {
				if (!(/^\d+$/.test(cmd.args[i]))) {
					return true;
				}
			}
			return false;
		}
		var currentLine = instance.getCursor().line, 
			data = {
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
		for (var i=change.from.line; i<=change.to.line; i++) {
			var hasError = false;
			if (i !== currentLine) {
				var text = instance.getLine(i);
				if (text && text.trim().length > 0) {
					hasError = isError(parser.parse(text));
				}
				if (hasError) {
					editor.addLineClass(i, "background", "editor-error");
				} else {
					editor.removeLineClass(i, "background", "editor-error");
				}
			}
		}
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
	function focus() {
		editor.focus();
	}
	var consumedLine = 0,
		editor = createEditor(),
		parser = new Parser();
	$.extend(this, {
		"reset": reset,
		"setCommand": setCommand,
		"setChangeHandling": setChangeHandling,
		"applyChange": applyChange,
		"del": del,
		"undo": undo,
		"focus": focus,
		"getCommands": getCommands,
		"readOnly": readOnly,
		"consumeLine": consumeLine
	});
}