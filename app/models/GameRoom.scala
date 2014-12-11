package models

import roomframework.command.CommandResponse
import roomframework.room.DefaultRoom
import akka.pattern.ask
import play.api.libs.json._
import play.api.i18n.Messages
import scala.concurrent.duration.Duration
import scala.concurrent.Future
import scala.concurrent.Await

class GameRoom(name: String) extends DefaultRoom(name) {
  private var status_ : Option[GameStatus] = None
  private var actionPair = ActionPair(None, None)

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

  private def doSendAction(player: String, action: JsValue) = {
    def canSend(act: ActionPair): Boolean = status_.map { status =>
      (act.salesforce.isDefined && act.heroku.isDefined) ||
      (act.salesforce.isDefined && !status.heroku.isEntried) ||
      (act.heroku.isDefined && !status.salesforce.isEntried)
    }.getOrElse(false)
    def doSend(act: ActionPair) = {
      val wait = JsObject(Seq(
        "command" -> JsString("wait")
      ))
      val data = JsObject(Seq(
        "salesforce" -> act.salesforce.getOrElse(wait),
        "heroku" -> act.heroku.getOrElse(wait)
      ))
      broadcast(new CommandResponse("turnAction", data).toString)
    }
    val newAct = player match {
      case "salesforce" => 
        if (actionPair.salesforce.isDefined) doSend(actionPair)
        actionPair.copy(salesforce = Some(action))
      case "heroku" => 
        if (actionPair.heroku.isDefined) doSend(actionPair)
        actionPair.copy(heroku = Some(action))
      case _ => throw new IllegalArgumentException(player)
    }
    if (canSend(newAct)) {
      doSend(newAct)
      actionPair = ActionPair(None, None)
    } else {
      actionPair = newAct
    }
  }
  def sendAction(player: String, action: JsValue) = {
    actor ! SendAction(player, action)
  }

  override def createActor = new GameActor()

  protected class GameActor extends RoomActor {
    override def receive = {
      case UpdateGameStatus(v) =>
        status_ = Some(v)
      case Entry(player, sessionId) =>
        sender ! doEntry(player, sessionId)
      case SendAction(player, action) => 
        doSendAction(player, action)
      case x => 
        super.receive(x)
    }

  }

  private case class ActionPair(salesforce: Option[JsValue], heroku: Option[JsValue])

  private case class UpdateGameStatus(status: GameStatus)
  private case class Entry(player: String, sessionId: String)
  private case class SendAction(player: String, action: JsValue)
}

