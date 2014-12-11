package models

import play.api.libs.json._

case class FieldObject(name: String, x: Int, y: Int, point: Option[Int], pointVisible: Option[Boolean]) {
  def toJson = JsObject(Seq(
    "name" -> JsString(name),
    "x" -> JsNumber(x),
    "y" -> JsNumber(y)
  ) ++ point.map("point" -> JsNumber(_)
  ) ++ pointVisible.map("pointVisible" -> JsBoolean(_)
  ))
}

object FieldObject {
  def fromJson(json: JsValue) = {
    FieldObject(
      name = (json \ "name").as[String],
      x = (json \ "x").as[Int],
      y = (json \ "y").as[Int],
      point = (json \ "point").asOpt[Int],
      pointVisible = (json \ "pointVisible").asOpt[Boolean]
    )
  }
}
