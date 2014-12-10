package models

import roomframework.room.DefaultRoom
import akka.pattern.ask
import play.api.libs.json._
import play.api.i18n.Messages
import scala.concurrent.duration.Duration
import scala.concurrent.Future
import scala.concurrent.Await

class GameRoom(name: String) extends DefaultRoom(name) {
  private var status_ : Option[GameStatus] = None

  def status = status_
  def status_=(v: GameStatus) = {
    actor ! UpdateGameStatus(v)
  }

  private def doEntry(player: String, sessionId: String): Either[String, Player] = {
    status_.map { s =>
      s.players.get(player).map { p =>
        if (p.isEntried) {
          Left(Messages("alreadyEntried", player))
        } else {
          val ns = s.entry(player, sessionId)
          status_ = Some(ns)
          Right(ns.players(player))
        }
      }.getOrElse(Left(s"Invalid player name: $player"))
    }.getOrElse(Left("Game not initialized"))
  }

  def entry(player: String, sessionId: String): Either[String, Player] = {
    val ret = (actor ? Entry(player, sessionId)).asInstanceOf[Future[Either[String, Player]]]
    Await.result(ret, Duration.Inf)
  }

  override def createActor = new GameActor()

  protected class GameActor extends RoomActor {
    override def receive = {
      case UpdateGameStatus(v) =>
        status_ = Some(v)
      case Entry(player, sessionId) =>
        sender ! doEntry(player, sessionId)
      case x => 
        super.receive(x)
    }

  }

  private case class UpdateGameStatus(status: GameStatus)
  private case class Entry(player: String, sessionId: String)
}

