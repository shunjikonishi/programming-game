package models

import play.api.libs.json._
import roomframework.room.RoomHandler
import roomframework.command.CommandResponse

class GameHandler(room: GameRoom) extends RoomHandler(room) {
  private def init = {
    addHandler("initGame") { command =>
      val sessionId = (command.data \ "sessionId").as[String]
      val status = GameStatus.fromJson(command.data \ "status")
      room.status = status
      broadcast(command.json(command.data))
      CommandResponse.None
    }
    addHandler("status") { command =>
      command.json(JsObject(Seq(
        "status" -> room.status.map(_.toJson).getOrElse(JsNull)
      )))
    }
  }

  init
}