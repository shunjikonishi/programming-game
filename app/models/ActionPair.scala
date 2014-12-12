package models

import play.api.libs.json._

case class ActionPair(salesforce: Option[JsValue], heroku: Option[JsValue]) {

  def toJson = {
    val wait = JsObject(Seq(
      "command" -> JsString("wait")
    ))
    JsObject(Seq(
      "salesforce" -> salesforce.getOrElse(wait),
      "heroku" -> heroku.getOrElse(wait)
    ))
  }
}

