if (typeof(pg) == "undefined") pg = {};

(function ($) {
"use strict";

var FIELD_SIZE = 50;

function showError(msg) {
	alert(msg);
}


pg.Application = function(gameId, sessionId) {
	function init() {
		initConnection(con);
		$("#game-gen").click(function() {
			initGame();
		});
		$("#toggle-setting").click(function() {
			$("#game-setting-table").toggle();
		});
		$("#salesforce-entry").click(function() {
			//ToDo
			$(this).prop("disabled", true);
		});
		$("#heroku-entry").click(function() {
			//ToDo
			$(this).prop("disabled", true);
		});
		$gameStart.click(function() {
			$gameStart.hide();
			codingStart();
			stopWatch.start(new GameSetting().codingTime(), executeStart());
		});
	}
	function initConnection(con) {
		con.on("initGame", function(data) {
			console.log("initGame", data);
		});
		con.request({
			"command": "status",
			"success": function(data) {
				if (data.status) {
					updateStatus(data.status);
				} else {
					initGame();
				}
			}
		});
	}
	function initGame() {
		var setting = new GameSetting();
		game.reset(setting.fieldWidth(), setting.fieldHeight());
		generateObject(setting.wallCount(), Wall);
		generateObject(setting.wallCount(), Point);
		$.each(game.getPlayers(), function(idx, p) {
			var pos = randomPos(true);
			p.reset(pos.x, pos.y);
		});
		resetEditors();
		var json = {
			"sessionId": sessionId,
			"status": {
				"setting": setting.toJson(),
				"salesforce": game.getSalesforce().toJson(),
				"heroku": game.getHeroku().toJson(),
				"bug": game.getBug().toJson(),
				"fields": []
			}
		};
		$.each(game.allFields(), function(idx, f) {
			if (f.hasObject()) {
				json.status.fields.push({
					"name": f.object().name(),
					"x": f.x,
					"y": f.y
				});
			}
		});
		con.request({
			"command": "initGame",
			"data": json
		});
	}
	function updateStatus(status) {
		function resetPlayerPos(player, pos) {
			player.reset(pos.x, pos.y);
		}
		var setting = new GameSetting();
		setting.update(status.setting);
		game.reset(setting.fieldWidth(), setting.fieldHeight());
		$.each(status.fields, function(idx, f) {
			if (f.name === "wall") {
				game.field(f.x, f.y).object(new Wall());
			} else if (f.name === "point") {
				game.field(f.x, f.y).object(new Point());
			}
		});
		resetPlayerPos(game.getSalesforce(), status.salesforce);
		resetPlayerPos(game.getHeroku(), status.heroku);
		resetPlayerPos(game.getBug(), status.bug);
	}
	function codingStart() {
		salesforceCtrl.codingStart();
		herokuCtrl.codingStart();
	}
	function executeStart() {
		
	}
	function random(n) {
		return Math.floor(Math.random() * n);
	}
	function randomPos(checkPlayerPos) {
		while (true) {
			var x = random(game.width),
				y = random(game.height),
				field = game.field(x, y);
			if (!field.hasObject() && (!checkPlayerPos || !game.hasPlayer(x, y))) {
				return {
					"x": x,
					"y": y
				};
			}
		}
	}
	function generateObject(cnt, Func) {
		for (var i=0; i<cnt; i++) {
			var pos = randomPos(false);
			game.field(pos.x, pos.y).object(new Func());
		}
	}
	function resetEditors() {
		$.each(game.getPlayers(), function(idx, p) {
			var pos = p.pos();
			if (p.isSalesforce()) {
				salesforceCtrl.getEditor().reset(pos.x, pos.y);
			} else if (p.isHeroku()) {
				herokuCtrl.getEditor().reset(pos.x, pos.y);
			}
		});
	}
	var con = new room.Connection(location.protocol.replace("http", "ws") + location.host + "/ws/" + gameId),
		game = new Game($("#game")),
		salesforceCtrl = new SalesforceCtrl(game),
		herokuCtrl = new HerokuCtrl(game),
		stopWatch = new StopWatch($("#stopwatch")),
		$gameStart = $("#game-start");

	init();
};


function Game($el) {
	function reset(width, height) {
		self.width = width;
		self.height = height;
		$el.find(".field").remove();
		fields = [];
		$el.width(width * FIELD_SIZE);
		$el.height(height * FIELD_SIZE);
		for (var x=0; x<width; x++) {
			var line = [];
			fields.push(line);
			for (var y=0; y<height; y++) {
				var $field = $("<div class='field'/>");
				$el.append($field);
				line.push(new Field($field, x, y));
			}
		}
		$.each(getPlayers(), function(idx, player) {
			player.reset(-1, -1);
		});
		$el.show();
	}
	function field(x, y) {
		return fields[y][x];
	}
	function allFields() {
		var ret = [];
		for (var y=0; y<fields.length; y++) {
			var line = fields[y];
			for (var x=0; x<line.length; x++) {
				ret.push(line[x]);
			}
		}
		return ret;
	}
	function hasPlayer(x, y) {
		var players = getPlayers();
		for (var i=0; i<players.length; i++) {
			var pos =players[i].pos();
			if (pos.x === x && pos.y === y) {
				return true;
			}
		}
		return false;
	}
	function createPlayer(imageSrc) {
		var ret = new Player(imageSrc, -1, -1);
		$el.append(ret.element());
		return ret;
	}
	function getPlayers() {
		var ret = [];
		ret.push(salesforce);
		ret.push(heroku);
		ret.push(bug);
		return ret;
	}
	function getSalesforce() {
		return salesforce;
	}
	function getHeroku() {
		return heroku;
	}
	function getBug() {
		return bug;
	}
	function runCommand(player, command) {
		var pos = player.pos(),
			end = false,
			wait = false;
		switch (command.command) {
			case "up":
				pos.y -= 1;
				if (pos.y < 0) {
					end = true;
				}
				break;
			case "down":
				pos.y += 1;
				if (pos.y >= self.height) {
					end = true;
				}
				break;
			case "left":
				pos.x -= 1;
				if (pos.x < 0) {
					end = true;
				}
				break;
			case "right":
				pos.x += 1;
				if (pos.x >= self.width) {
					end = true;
				}
				break;
			case "wait":
				wait = true;
				break;
		}
		if (end) {
			gameover(player, pos.x, pos.y);
			return;
		}
		if (!wait) {
			var obj = field(pos.x, pos.y).object();
			if (obj) {
				if (obj.canEnter()) {
					obj.visible(false);
				} else {
					wait = true;
				}
			} 
		}
		if (!wait) {
			player.pos(pos.x, pos.y);
		}
	}
	function gameover(player, x, y) {
		player.reset();
	}
	function test(player, commands) {
		function run() {
			setTimeout(function() {
				if (player.commandCount() > 0) {
					runCommand(player, player.nextCommand());
					run();
				} else {
					player.reset();
					$.each(allFields(), function(idx, f) {
						if (f.object()) {
							f.object().visible(true);
						}
					});
				}
			}, 200);
		}
		var context = {
			"p": player,
			"onError": function(msg) {
				console.log(msg);
				player.wait();
			}
		}, interpreter = new Interpreter(context, new Parser());
		$.each(commands, function(idx, cmd) {
			interpreter.run(cmd);
		});
		run();
	}
	var self = this,
		fields = [],
		salesforce = createPlayer("/assets/images/salesforce.png"),
		heroku = createPlayer("/assets/images/heroku.png"),
		bug = createPlayer("/assets/images/bug.png");
	$.extend(this, {
		"field": field,
		"allFields": allFields,
		"reset": reset,
		"getPlayers": getPlayers,
		"hasPlayer": hasPlayer,
		"getSalesforce": getSalesforce,
		"getHeroku": getHeroku,
		"getBug": getBug,
		"test": test
	});
}


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
		"toJson": toJson
	});
}
function Field($el, x, y) {
	var obj = null;
	function hasObject() { return !!obj;}
	function object(v) {
		if (v === undefined) {
			return obj;
		} else {
			obj = v;
			$el.empty().append(obj.image);
		}
	}
	$.extend(this, {
		"x": x,
		"y": y,
		"hasObject": hasObject,
		"object": object
	});
}

function FieldObject(name, imageSrc, enterable) {
	var $img = $("<img/>");
	$img.attr("src", imageSrc);
	$img.addClass("object");

	function image() { return $img;}
	function canEnter() { return enterable;}
	function visible(v) {
		if (v === undefined) {
			return !!$img.hasClass("hide");
		} else if (v) {
			$img.removeClass("hide");
		} else {
			$img.addClass("hide");
		}
	}
	$.extend(this, {
		"name": function() { return name;},
		"image": image,
		"canEnter": canEnter,
		"visible": visible
	});
}

function Wall() {
	this.__proto__ = new FieldObject("wall", "/assets/images/wall.png", false);
}

function Point() {
	this.__proto__ = new FieldObject("point", "/assets/images/gold.png", true);
}
function Player(imageSrc, initialX, initialY) {
	function init() {
		var $img = $("<img/>");
		$img.attr("src", imageSrc);
		$div.append($img);
		$div.addClass("player");
		reset(initialX, initialY);
	}
	function isSalesforce() {
		return imageSrc.indexOf("salesforce") !== -1;
	}
	function isHeroku() {
		return imageSrc.indexOf("heroku") !== -1;
	}
	function element() {
		return $div;
	}
	function reset(nx, ny) {
		commands = [];
		if (nx !== undefined) {
			initialX = nx;
		}
		if (ny !== undefined) {
			initialY = ny;
		} 
		pos(initialX, initialY);
	}
	function nextCommand() {
		return commands.shift();
	}
	function commandCount() {
		return commands.length;
	}
	function pos(nx, ny) {
		if (arguments.length === 0) {
			return {
				"x": x,
				"y": y
			};
		}
		x = nx;
		y = ny;
		var left = x * FIELD_SIZE,
			top = y * FIELD_SIZE;
		$div.css({
			"left": left,
			"top": top
		});
	}
	function wait() {
		commands.push({
			"command": "wait"
		});
	}
	function move(command, n) {
		n = parseInt(n || 1);
		if (n === 0) {
			wait();
		} else {
			for (var i=0; i<n; i++) {
				commands.push({
					"command": command
				});
			}
		}
	}
	function left(n) {
		move("left", n);
	}
	function right(n) {
		move("right", n);
	}
	function up(n) {
		move("up", n);
	}
	function down(n) {
		move("down", n);
	}
	function entry(v) {
		sessionId = v;
	}
	function getSessionId() {
		return sessionId;
	}
	function toJson() {
		var ret = {
			"x": x,
			"y": y
		};
		if (sessionId) {
			ret.sessionId = sessionId;
		}
		return ret;
	}
	var x, y,
		$div = $("<div/>"),
		sessionId = null,
		commands = [];

	$.extend(this, {
		"element": element,
		"isSalesforce": isSalesforce,
		"isHeroku": isHeroku,
		"nextCommand": nextCommand,
		"commandCount": commandCount,
		"reset": reset,
		"pos": pos,
		"wait": wait,
		"left": left,
		"right": right,
		"up": up,
		"down": down,
		"getSessionId": getSessionId,
		"entry": entry,
		"toJson": toJson
	});
	init();
}
function SalesforceCtrl(game) {
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
		enableButtons(true);
	}
	function getEditor() {
		return editor;
	}
	var editor = new TextEditor($("#salesforce-editor")),
		$ins = $("#salesforce-ins");
	init();
	$.extend(this, {
		"getEditor": getEditor,
		"codingStart": codingStart
	});
}
function HerokuCtrl(game) {
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
		editor.readOnly(false);
	}
	var editor = new TextEditor($("#heroku-editor"));
	init();
	$.extend(this, {
		"getEditor": getEditor,
		"codingStart": codingStart
	});
}
function TextEditor($textarea) {
	var editor = CodeMirror.fromTextArea($textarea[0], {
		"mode": "javascript",
		"lineNumbers": true,
		"readOnly": true,
		"styleActiveLine": true
	});
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
	$.extend(this, {
		"reset": reset,
		"setCommand": setCommand,
		"del": del,
		"undo": undo,
		"getCommands": getCommands,
		"readOnly": readOnly
	});
}
function Parser() {
	var STATE_OBJECT = 1,
		STATE_METHOD = 2,
		STATE_ARGS   = 3,
		STATE_END    = 4;
	function error(str) {
		return {
			"error": "Syntax error: " + str
		};
	}
	function skipWhitespace(str, pos) {
		while (pos < str.length) {
			var c = str.charAt(pos);
			if (c !== ' ' && c !== '\t' && c !== '\r' && c !== '\n') {
				return pos;
			}
			pos++;
		}
		return pos;
	}
	function isNumber(str) {
		return /^[-]?\d+(\.\d+)?$/.test(str);
	}
	function isValidArg(str) {
		return str === "true" || str === "false" || str === "null" || isNumber(str);
	}
	function convertArg(str) {
		switch (str) {
			case "true": return true;
			case "false": return false;
			case "null": return null;
			default: return Number(str);
		}
	}
	function parse(str) {
		var pos = 0,
			state = STATE_OBJECT,
			obj = null,
			method = null,
			args = [],
			buf = [],
			arg, n;
		while (pos < str.length) {
			var c = str.charAt(pos++);
			switch (c) {
				case '.':
					if (state === STATE_OBJECT) {
						obj = buf.join("");
						buf = [];
						state = STATE_METHOD;
					} else {
						return error(str);
					}
					break;
				case '(':
					if (state === STATE_METHOD) {
						method = buf.join("");
						buf = [];
						state = STATE_ARGS;
					} else {
						return error(str);
					}
					break;
				case '"':
				case "'":
					if (state === STATE_ARGS) {
						if (buf.length > 0) {
							return error(str);
						}
						n = str.indexOf(c, pos);
						if (n === -1) {
							return error(str);
						}
						args.push(str.substring(pos, n));
						pos = skipWhitespace(str, n + 1);
						if (str.charAt(pos) === ",") {
							pos = skipWhitespace(pos + 1);
						}
					} else {
						return error(str);
					}
					break;
				case ',':
					if (state === STATE_ARGS) {
						if (buf.length === 0) {
							return error(str);
						}
						arg = buf.join("");
						if (isValidArg(arg)) {
							args.push(convertArg(arg));
						} else {
							return error(str);
						}
						buf = [];
						pos = skipWhitespace(pos);
					} else {
						return error(str);
					}
					break;
				case ')':
					if (state === STATE_ARGS) {
						if (buf.length > 0) {
							arg = buf.join("");
							if (isValidArg(arg)) {
								args.push(convertArg(arg));
							} else {
								return error(str);
							}
							buf = [];
						}
						state = STATE_END;
					} else {
						return error(str);
					}
					break;
				case ';':
					if (state !== STATE_END) {
						return error(str);
					}
					break;
				default:
					if (state !== STATE_END) {
						buf.push(c);
					} else {
						return error(str);
					}
					break;
			}
		}
		if (state !== STATE_END) {
			return error(str);
		}
		return {
			"object": obj,
			"method": method,
			"args": args
		};
	}
	$.extend(this, {
		"parse": parse
	});
}
function Interpreter(context, parser) {
	function run(command) {
		if (typeof(command) === "string") {
			command = parser.parse(command);
		}
		if (command.error) {
			handleError(command.error);
			return;
		}
		var obj = context[command.object];
		if (!obj) {
			handleError("Object " + command.object + " is not defined.");
			return;
		}
		var method = obj[command.method];
		if (!method) {
			handleError("Method " + command.method + " is not defined.");
			return;
		}
		method.apply(obj, command.args);
	}
	function handleError(err) {
		if (context.onError) {
			context.onError(err);
		}
	}
	$.extend(this, {
		"run": run
	});
}
function StopWatch($el) {
	function show() {
		var min = Math.floor(second / 60),
			sec = second % 60,
			text = ("0" + min).slice(-2) + ":" + ("0" + sec).slice(-2);
		$el.text(text);
	}
	function countDown() {
		second--;
		show();
		if (second > 0) {
			setTimeout(countDown, 1000);
		} else if (callback) {
			$el.hide();
			callback();
		}
	}
	function start(sec, func) {
		$el.show();
		second = sec;
		callback = func;
		show();
		setTimeout(countDown, 1000);
	}
	var second = 0,
		callback = null;
	$.extend(this, {
		"start": start
	});
}
})(jQuery);
