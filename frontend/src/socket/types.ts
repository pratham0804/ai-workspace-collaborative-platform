import type { Column, Comment, Task } from "../types/kanban";

export type BoardEventType =
  | "task:created"
  | "task:updated"
  | "task:deleted"
  | "task:moved"
  | "comment:created"
  | "comment:deleted"
  | "column:created"
  | "column:updated"
  | "column:deleted";

export interface BoardRealtimeEvent<T = unknown> {
  eventId: string;
  type: BoardEventType;
  workspaceId: number;
  boardId: number;
  actorId: number;
  timestamp: string;
  data: T;
}

export interface TaskDeletedData {
  id: number;
  columnId: number;
}

export interface TaskMovedData {
  task: Task;
  sourceColumnId: number;
  targetColumnId: number;
  targetPosition: number;
}

export interface CommentDeletedData {
  id: number;
  taskId: number;
  columnId: number;
}

export interface ColumnDeletedData {
  id: number;
  boardId: number;
}

export type JoinAck =
  | { ok: true }
  | { ok: false; error: string };

export interface ServerToClientEvents {
  "task:created": (event: BoardRealtimeEvent<Task>) => void;
  "task:updated": (event: BoardRealtimeEvent<Task>) => void;
  "task:deleted": (event: BoardRealtimeEvent<TaskDeletedData>) => void;
  "task:moved": (event: BoardRealtimeEvent<TaskMovedData>) => void;
  "comment:created": (event: BoardRealtimeEvent<Comment>) => void;
  "comment:deleted": (event: BoardRealtimeEvent<CommentDeletedData>) => void;
  "column:created": (event: BoardRealtimeEvent<Column>) => void;
  "column:updated": (event: BoardRealtimeEvent<Column>) => void;
  "column:deleted": (event: BoardRealtimeEvent<ColumnDeletedData>) => void;
}

export interface ClientToServerEvents {
  "board:join": (
    payload: { workspaceId: number; boardId: number },
    ack?: (result: JoinAck) => void
  ) => void;
  "board:leave": (
    payload: { boardId: number },
    ack?: (result: JoinAck) => void
  ) => void;
}

export const SOCKET_URL = "http://localhost:5000";

export const BOARD_EVENTS: BoardEventType[] = [
  "task:created",
  "task:updated",
  "task:deleted",
  "task:moved",
  "comment:created",
  "comment:deleted",
  "column:created",
  "column:updated",
  "column:deleted",
];
