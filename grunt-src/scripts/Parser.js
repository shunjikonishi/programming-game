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
		var pos = skipWhitespace(str, pos),
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