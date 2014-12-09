package models

import roomframework.room.DefaultRoom
import play.api.libs.json._

class GameRoom(name: String) extends DefaultRoom(name) {
  private var gameStatus: Option[GameStatus] = None
}

case class Player(x: Int, y: Int, sessionId: Option[String]) {
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

case class FieldObject(kind: String, x: Int, y: Int) {
  def toJson = JsObject(Seq(
    "kind" -> JsString(kind),
    "x" -> JsNumber(x),
    "y" -> JsNumber(y)
  ))
}

object FieldObject {
  def fromJson(json: JsValue) = {
    FieldObject(
      kind = (json \ "kind").as[String],
      x = (json \ "x").as[Int],
      y = (json \ "y").as[Int]
    )
  }
}

case class GameSetting(
  fieldWidth: Int,
  fieldHeight: Int,
  pointCount: Int,
  wallCount: Int,
  codingTime: Int,
  gameTime: Int
)

object GameSetting {
  def fromJson(json: JsValue) = {
    GameSetting(
      fieldWidth = (json \ "fieldWidth").as[Int],
      fieldHeight = (json \ "fieldHeight").as[Int],
      pointCount = (json \ "pointCount").as[Int],
      wallCount = (json \ "wallCount").as[Int],
      codingTime = (json \ "codingTime").as[Int],
      gameTime = (json \ "gameTime").as[Int]
    )
  }
}

case class GameStatus(
  setting: GameSetting,
  salesforce: Player,
  heroku: Player,
  bug: Player,
  fields: Seq[FieldObject]
)

object GameStatus {
  def fromJson(json: JsValue) = {
    GameStatus(
      setting = GameSetting.fromJson(json \ "setting"),
      salesforce = Player.fromJson(json \ "salesforce"),
      heroku = Player.fromJson(json \ "heroku"),
      bug = Player.fromJson(json \ "bug"),
      fields = (json \ "fields") match {
        case JsArray(seq) => seq.map(FieldObject.fromJson(_))
        case _ => throw new IllegalArgumentException()
      }
    )
  }
}
