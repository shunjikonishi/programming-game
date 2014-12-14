function Chat($el, con) {
	function init() {
		var pressedKey = 0;
		$msg.keypress(function(e) {
			pressedKey = e.keyCode || e.which;
		});
		$msg.keyup(function(e) {
			var code = e.keyCode || e.which;
			if (code === 13 && pressedKey === 13) {
				var msg = $msg.val(),
					name = $nickname.val() || MSG.noname;
				if (msg) {
					con.request({
						"command": "chat",
						"data": {
							"name": name,
							"msg": msg
						}
					});
					$msg.val("");
				}
				pressedKey = 0;
			}
		});
		load();
	}
	function processMessage(data) {
		var $li = $("<li><label/><span/></li>");
		list.push(data);
		if (list.length > 20) {
			list.shift();
			$log.find("li:last").remove();
		}
		$li.find("label").text(data.name);
		$li.find("span").text(data.msg);
		$log.prepend($li);
	}
	function chatMessage(data) {
		processMessage(data);
		popup.push(data);
		showPopup();
		save();
	}
	function storageKey() {
		var ret = location.pathname;
		return ret.substring(ret.lastIndexOf("/") + 1);
	}
	function save() {
		if (sessionStorage) {
			sessionStorage.setItem(storageKey(), JSON.stringify(list));
			sessionStorage.setItem("nickname", $nickname.val());
		}
	}
	function load() {
		if (sessionStorage) {
			var str = sessionStorage.getItem(storageKey());
			if (str) {
				$.each(JSON.parse(str), function(idx, data) {
					processMessage(data);
				});
			}
			$nickname.val(sessionStorage.getItem("nickname"));
		}
	}
	function showPopup() {
		if (popup.length === 0 || $popup.is(":visible")) {
			return;
		}
		var data = popup.shift();
		$popup.find("label").text(data.name);
		$popup.find("span").text(data.msg);
		$popup.fadeIn(500);
		setTimeout(function() {
			if (popup.length === 0) {
				$popup.fadeOut(500);
			} else {
				$popup.hide();
				showPopup();
			}
		}, 3000);
	}
	var $nickname = $el.find(".chat-nickname"),
		$msg = $el.find(".chat-msg"),
		$log = $el.find(".chat-log"),
		$popup = $el.find(".chat-popup"),
		list = [],
		popup = [];
	init();
	$.extend(this, {
		"chatMessage": chatMessage
	});
}