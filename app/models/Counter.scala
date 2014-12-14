package models

import roomframework.redis.RedisService
import com.redis.serialization.Parse.Implicits._

trait Counter {
  private val SALESFORCE_WIN = "salesforce-win"
  private val HEROKU_WIN = "heroku-win"
  private val DRAW = "draw"

  def get(key: String): Long
  def inc(key: String): Long

  def getSalesforceWin: Long = get(SALESFORCE_WIN)
  def getHerokuWin: Long = get(HEROKU_WIN)
  def getDraw: Long = get(DRAW)

  def incSalesforceWin: Long = inc(SALESFORCE_WIN)
  def incHerokuWin: Long = inc(HEROKU_WIN)
  def incDraw: Long = inc(DRAW)
}

class RedisCounter(redis: RedisService) extends Counter {
  override def get(key: String): Long = redis.get[Long](key).getOrElse(0L)
  override def inc(key: String): Long = redis.incr(key).getOrElse {
    redis.set(key, 1L)
    1L
  }
}

class MapCounter extends Counter {
  private val map = collection.mutable.Map(
    "salesforce-win" -> 0L,
    "heroku-win" -> 0L,
    "draw" -> 0L
  )

  override def get(key: String): Long = map(key)
  override def inc(key: String): Long = {
    val ret = get(key) + 1
    map += (key -> ret)
    ret
  }
}

object Counter {
  private val instance = sys.env.get("REDISCLOUD_URL").map( v =>
    new RedisCounter(RedisService(v))
  ).getOrElse(new MapCounter())

  def apply = instance
}
