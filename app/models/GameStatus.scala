package models

import play.api.libs.json._

case class GameStatus(
  setting: GameSetting,
  fields: Seq[FieldObject],
  players: Map[String, Player]
) {
  def salesforce = players("salesforce")
  def heroku = players("heroku")
  def bug = players("bug")

  def entry(player: String, sessionId: String) = {
    copy(players = players + (player -> players(player).entry(sessionId)))
  }

  def retire(player: String, sessionId: String) = {
    copy(players = players + (player -> players(player).retire(sessionId)))
  }
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
    val players = Map(
      "salesforce" -> Player.fromJson(json \ "salesforce"),
      "heroku" -> Player.fromJson(json \ "heroku"),
      "bug" -> Player.fromJson(json \ "bug")
    )
    GameStatus(
      setting = GameSetting.fromJson(json \ "setting"),
      fields = (json \ "fields") match {
        case JsArray(seq) => 
          seq.map(FieldObject.fromJson(_))
        case _ => 
          throw new IllegalArgumentException()
      },
      players = players
    )
  }
}
