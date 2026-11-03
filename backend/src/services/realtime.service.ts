import { randomUUID } from "node:crypto";
import { getIO } from "../socket/index.js";
import { boardRoom } from "../socket/rooms.js";
import type {
  BoardEventType,
  BoardRealtimeEvent,
} from "../socket/types.js";

export function broadcastBoardEvent<T>(
  type: BoardEventType,
  workspaceId: number,
  boardId: number,
  actorId: number,
  data: T
) {
  const io = getIO();

  if (!io) {
    console.warn("[socket] skipped broadcast; Socket.IO is not initialized");
    return;
  }

  const event: BoardRealtimeEvent<T> = {
    eventId: randomUUID(),
    type,
    workspaceId,
    boardId,
    actorId,
    timestamp: new Date().toISOString(),
    data,
  };

  io.to(boardRoom(boardId)).emit(type, event);
}
