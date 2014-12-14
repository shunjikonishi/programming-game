package models

import play.api.libs.json._
import roomframework.room.RoomHandler
import roomframework.command.CommandResponse
import roomframework.command.CommandFilter

class GameHandler(room: GameRoom, sessionId: String) extends RoomHandler(room) with CommandFilter {
  private def init = {
    addHandler("noop") { command =>
      CommandResponse.None
    }
    addHandler("initGame") { command =>
      val sessionId = (command.data \ "sessionId").as[String]
      val status = GameStatus.fromJson(command.data \ "status")
      room.status = status
      broadcast(command.json(command.data))
      CommandResponse.None
    }
    addHandler("status") { command =>
      command.json(JsObject(Seq(
        "status" -> room.status.map(_.toJson).getOrElse(JsNull),
        "replayData" -> JsArray(room.commands.map(_.toJson))
      )))
    }
    addHandler("entry") { command =>
      val player = (command.data \ "player").as[String]
      val sessionId = (command.data \ "sessionId").as[String]
      room.entry(player, sessionId) match {
        case Left(msg) => new CommandResponse("alert", msg)
        case Right(_) => 
          broadcast(new CommandResponse("playerStatus", command.data))
          CommandResponse.None
      }
    }
    addHandler("change") { command =>
      broadcast(command.json(command.data))
      CommandResponse.None
    }
    addHandler("codingStart") { command =>
      room.codingStart(command.data)
      CommandResponse.None
    }
    addHandler("gameEnd") { command =>
      val winner = (command.data \ "winner").as[String]
      room.gameEnd(winner)
      CommandResponse.None
    }
    addHandler("playerAction") { command =>
      val player = (command.data \ "player").as[String]
      val action = command.data \ "action"
      room.sendAction(player, action)
      CommandResponse.None
    }
    addHandler("chat") { command =>
      broadcast(command.json(command.data))
      CommandResponse.None
    }
    addBroadcastFilter(this)
  }


  def filter(msg: CommandResponse): Option[CommandResponse] = {
    def filterChange(msg: CommandResponse): Boolean = {
      val name = (msg.data \ "name").as[String]
      (for (
        status <- room.status;
        player <- status.players.get(name);
        id <- player.sessionId
      ) yield {
        id == sessionId
      }).getOrElse(false)
    }
    def filterEntried: Boolean = {
      room.status.filter(_.isEntried(sessionId)).isDefined
    }
    if (msg.name == "initGame" && (msg.data \ "sessionId").as[String] == sessionId) {
      None
    } else if (msg.name == "change" && filterChange(msg)) {
      None
    } else if (msg.name == "commandRequest" && !filterEntried) {
      None
    } else {
      Some(msg)
    }
  }

  init
}