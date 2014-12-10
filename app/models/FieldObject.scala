package models

import play.api.libs.json._

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
