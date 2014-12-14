package models

import play.api.libs.concurrent.Akka
import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.concurrent.duration.DurationInt

import scala.collection.mutable.ListBuffer
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
  private val commands_ : ListBuffer[ActionPair] = ListBuffer()

  def status = status_
  def status_=(v: GameStatus) = {
    actor ! UpdateGameStatus(v)
  }

  def commands = commands_

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

  def doCodingStart(data: JsValue) = {
    status_.filter(!_.running).foreach { s =>
      val codingTime = (data \ "codingTime").as[Int]
      val gameTime = (data \ "gameTime").as[Int]
      val turnTime = (data \ "turnTime").as[Int]

      status_ = Some(s.copy(
        setting = s.setting.copy(
          codingTime = codingTime,
          gameTime = gameTime,
          turnTime = turnTime
        ),
        running = true
      ))
      broadcast(new CommandResponse("codingStart", data).toString)
      Akka.system.scheduler.scheduleOnce(codingTime seconds) {
        broadcast(new CommandResponse("executeStart", data).toString)
        commandRequest(3000, gameTime, turnTime - 1)
      }
    }
  }

  def commandRequest(next: Int, rest: Int, turnTime: Int): Unit = {
    Akka.system.scheduler.scheduleOnce(next milliseconds) {
      broadcast(new CommandResponse("commandRequest", JsNull).toString)
      if (rest > 0) {
        commandRequest(turnTime, rest - 1, turnTime)
      }
    }
  }
  
  def codingStart(data: JsValue) = {
    actor ! CodingStart(data)
  }

  def doGameEnd(winner: String) = {
    status_.filter(_.running).foreach { s =>
      val counter = Counter.apply
      val key = winner match {
        case "draw" => winner
        case x => x.toLowerCase + "-win"
      }
      counter.inc(key)
      val ret = JsObject(Seq(
        "winner" -> JsString(winner),
        "salesforce" -> JsNumber(counter.getSalesforceWin),
        "heroku" -> JsNumber(counter.getHerokuWin),
        "draw" -> JsNumber(counter.getDraw),
        "replays" -> JsArray(commands_.map(_.toJson))
      ))
      status_ = Some(s.reset)
      broadcast(new CommandResponse("gameEnd", ret).toString)
    }
  }

  def gameEnd(winner: String) = {
    actor ! GameEnd(winner)
  }

  private def doSendAction(player: String, action: JsValue) = {
    def canSend(act: ActionPair): Boolean = status_.map { status =>
      (act.salesforce.isDefined && act.heroku.isDefined) ||
      (act.salesforce.isDefined && !status.heroku.isEntried) ||
      (act.heroku.isDefined && !status.salesforce.isEntried)
    }.getOrElse(false)
    def doSend(act: ActionPair) = {
      commands_ += act
      broadcast(new CommandResponse("turnAction", act.toJson).toString)
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
        commands_.clear
        status_ = Some(v)
      case Entry(player, sessionId) =>
        sender ! doEntry(player, sessionId)
      case SendAction(player, action) => 
        doSendAction(player, action)
      case CodingStart(data) =>
        doCodingStart(data)
      case GameEnd(winner) =>
        doGameEnd(winner)
      case x => 
        super.receive(x)
    }

  }

  private case class UpdateGameStatus(status: GameStatus)
  private case class Entry(player: String, sessionId: String)
  private case class SendAction(player: String, action: JsValue)
  private case class CodingStart(data: JsValue)
  private case class GameEnd(winner: String)
}

