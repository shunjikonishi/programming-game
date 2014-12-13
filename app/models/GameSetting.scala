package models

import play.api.libs.json._

case class GameSetting(
  fieldWidth: Int,
  fieldHeight: Int,
  pointCount: Int,
  wallCount: Int,
  codingTime: Int,
  gameTime: Int,
  turnTime: Int
) {
  def toJson = JsObject(Seq(
    "fieldWidth" -> JsNumber(fieldWidth),
    "fieldHeight" -> JsNumber(fieldHeight),
    "pointCount" -> JsNumber(pointCount),
    "wallCount" -> JsNumber(wallCount),
    "codingTime" -> JsNumber(codingTime),
    "gameTime" -> JsNumber(gameTime),
    "turnTime" -> JsNumber(turnTime)
  ))
}

object GameSetting {
  def fromJson(json: JsValue) = {
    GameSetting(
      fieldWidth = (json \ "fieldWidth").as[Int],
      fieldHeight = (json \ "fieldHeight").as[Int],
      pointCount = (json \ "pointCount").as[Int],
      wallCount = (json \ "wallCount").as[Int],
      codingTime = (json \ "codingTime").as[Int],
      gameTime = (json \ "gameTime").as[Int],
      turnTime = (json \ "turnTime").as[Int]
    )
  }
}
