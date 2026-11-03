import type { AuthUser } from "../types/auth-user.js";

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
  revision?: number;
  data: T;
}

export interface JoinBoardPayload {
  workspaceId: number;
  boardId: number;
}

export interface LeaveBoardPayload {
  boardId: number;
}

export type JoinAck =
  | { ok: true }
  | { ok: false; error: string };

export interface ClientToServerEvents {
  "board:join": (
    payload: JoinBoardPayload,
    ack?: (result: JoinAck) => void
  ) => void;
  "board:leave": (
    payload: LeaveBoardPayload,
    ack?: (result: JoinAck) => void
  ) => void;
}

export interface ServerToClientEvents {
  "task:created": (event: BoardRealtimeEvent) => void;
  "task:updated": (event: BoardRealtimeEvent) => void;
  "task:deleted": (event: BoardRealtimeEvent) => void;
  "task:moved": (event: BoardRealtimeEvent) => void;
  "comment:created": (event: BoardRealtimeEvent) => void;
  "comment:deleted": (event: BoardRealtimeEvent) => void;
  "column:created": (event: BoardRealtimeEvent) => void;
  "column:updated": (event: BoardRealtimeEvent) => void;
  "column:deleted": (event: BoardRealtimeEvent) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: AuthUser;
  workspaceId?: number | undefined;
  boardId?: number | undefined;
}
