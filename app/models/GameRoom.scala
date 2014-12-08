package models

import roomframework.room.DefaultRoom
import play.api.libs.json._

class GameRoom(name: String) extends DefaultRoom(name) {
}

case class Player(x: Int, y: Int, sessionId: Option[String]) {
  def toJson = JsObject(Seq(
    "x" -> JsNumber(x),
    "y" -> JsNumber(y)
  ) ++ sessionId.map("sessionId" -> JsString(_)))
}

case class FieldObject(kind: String, x: Int, y: Int) {
  def toJson = JsObject(Seq(
    "kind" -> JsString(kind),
    "x" -> JsNumber(x),
    "y" -> JsNumber(y)
  ))
}

case class GameStatus(
  salesforce: Player,
  heroku: Player,
  fields: Seq[FieldObject]
)

case class GameSetting(
  fieldWidth: Int,
  fieldHeight: Int,
  pointCount: Int,
  wallCount: Int,
  codingTime: Int,
  gameTime: Int
)