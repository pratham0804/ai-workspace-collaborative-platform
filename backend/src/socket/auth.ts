import type { Socket } from "socket.io";
import { getUserFromAccessToken } from "../utils/access-token.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export async function socketAuthMiddleware(
  socket: AppSocket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth?.token;

  if (typeof token !== "string" || token.length === 0) {
    return next(new Error("Access token is required"));
  }

  try {
    socket.data.user = await getUserFromAccessToken(token);
    next();
  } catch {
    next(new Error("Invalid or expired access token"));
  }
}
