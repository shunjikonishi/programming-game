package models

import roomframework.room.DefaultRoom
import play.api.libs.json._

class GameRoom(name: String) extends DefaultRoom(name) {
  private var status_ : Option[GameStatus] = None

  def status = status_
  def status_=(v: GameStatus) = {
    actor ! UpdateGameStatus(v)
  }

  override def createActor = new GameActor()

  protected class GameActor extends RoomActor {
    override def receive = {
      case UpdateGameStatus(v) =>
        status_ = Some(v)
      case x => super.receive(x)
    }

  }

  private case class UpdateGameStatus(status: GameStatus)
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

case class FieldObject(name: String, x: Int, y: Int) {
  def toJson = JsObject(Seq(
    "name" -> JsString(name),
    "x" -> JsNumber(x),
    "y" -> JsNumber(y)
  ))
}

object FieldObject {
  def fromJson(json: JsValue) = {
    FieldObject(
      name = (json \ "name").as[String],
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
) {
  def toJson = JsObject(Seq(
    "fieldWidth" -> JsNumber(fieldWidth),
    "fieldHeight" -> JsNumber(fieldHeight),
    "pointCount" -> JsNumber(pointCount),
    "wallCount" -> JsNumber(wallCount),
    "codingTime" -> JsNumber(codingTime),
    "gameTime" -> JsNumber(gameTime)
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
) {
  def toJson = JsObject(Seq(
    "setting" -> setting.toJson,
    "salesforce" -> salesforce.toJson,
    "heroku" -> heroku.toJson,
    "bug" -> bug.toJson,
    "fields" -> JsArray(fields.map(_.toJson))
  ))
}

object GameStatus {
  def fromJson(json: JsValue) = {
    GameStatus(
      setting = GameSetting.fromJson(json \ "setting"),
      salesforce = Player.fromJson(json \ "salesforce"),
      heroku = Player.fromJson(json \ "heroku"),
      bug = Player.fromJson(json \ "bug"),
      fields = (json \ "fields") match {
        case JsArray(seq) => 
          seq.map(FieldObject.fromJson(_))
        case _ => 
          throw new IllegalArgumentException()
      }
    )
  }
}
