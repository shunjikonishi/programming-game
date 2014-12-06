@(map: Map[String, String])
var MSG = {@map.map { case(key, value) =>
	"@key.substring(3)" : "@value",}
	"format" : function(fmt) {
		for (i = 1; i < arguments.length; i++) {
			var reg = new RegExp("\\{" + (i - 1) + "\\}", "g")
			fmt = fmt.replace(reg,arguments[i]);
		}
		return fmt;
	}
}
