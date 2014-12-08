package controllers

import play.api._
import play.api.mvc._
import play.api.i18n.MessagesPlugin;
import java.util.UUID

object Application extends Controller {

  def index = Action { implicit request =>
    val id = UUID.randomUUID.toString
    Ok(views.html.index(request.host, id))
  }

  def game(id: String) = Action {
    Ok(views.html.game(id))
  }

  def ws(id: String) = Action {
    Ok("WS")
  }
  /*
  def ws = WebSocket.using[String] { implicit request =>
    val sessionId = request.cookies.get(AppConfig.cookieName).map(_.value).getOrElse(throw new IllegalStateException())
    val h = pm.console(sessionId)
    (h.in, h.out)
  }
  */

  def messages(lang: String) = Action { implicit request =>
    val map = Play.current.plugin[MessagesPlugin]
      .map(_.api.messages).getOrElse(Map.empty);
    val langMap = map("default") ++ map.getOrElse(lang, Map.empty)
    Ok(views.js.messages(langMap.filterKeys(_.startsWith("ui."))))
  }
}