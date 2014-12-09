package models

import roomframework.room.RoomManager
import roomframework.room.RoomFactory

object GameManager extends RoomManager(new GameRoomFactory())

class GameRoomFactory extends RoomFactory[GameRoom] {
  def createRoom(name: String) = new GameRoom(name)
}