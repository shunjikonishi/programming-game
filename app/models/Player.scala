package models

import play.api.libs.json._

case class Player(x: Int, y: Int, sessionId: Option[String]) {
  def isEntried = sessionId.isDefined

  def entry(id: String) = copy(sessionId=Some(id))
  def reset = copy(sessionId=None)

  def toJson = JsObject(Seq(
    "x" -> JsNumber(x),
    "y" -> JsNumber(y)
  ) ++ sessionId.map("sessionId" -> JsString(_)))
}

object Player {
  def fromJson(json: JsValue) = {
    Player(
      x = (json \ "x").as[Int],
      y = (json \ "y").as[Int],
      sessionId = (json \ "sessionId").asOpt[String]
    )
  }
}
