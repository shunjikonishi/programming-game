package controllers

import play.api._
import play.api.mvc._
import play.api.i18n.MessagesPlugin;
import java.util.UUID
import models.GameManager
import models.GameHandler

object Application extends Controller {

  def index = Action { implicit request =>
    val gameId = UUID.randomUUID.toString
    val sessionId = request.session.get("sessionId").getOrElse(UUID.randomUUID.toString)
    Ok(views.html.index(request.host, gameId)).withSession(
      "sessionId" -> sessionId
    )
  }

  def game(gameId: String) = Action { implicit request =>
    val sessionId = request.session.get("sessionId").getOrElse(UUID.randomUUID.toString)
    Ok(views.html.game(gameId, sessionId)).withSession(
      "sessionId" -> sessionId
    )
  }

  def ws(gameId: String) = WebSocket.using[String] { implicit request =>
    val sessionId = request.session("sessionId")
    val room = GameManager.join(gameId)
    val h = new GameHandler(room, sessionId)
    (h.in, h.out)
  }

  def messages(lang: String) = Action { implicit request =>
    val map = Play.current.plugin[MessagesPlugin]
      .map(_.api.messages).getOrElse(Map.empty);
    val langMap = map("default") ++ map.getOrElse(lang, Map.empty)
    Ok(views.js.messages(langMap.filterKeys(_.startsWith("ui."))))
  }
}