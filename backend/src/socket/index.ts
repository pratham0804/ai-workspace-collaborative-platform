import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { socketAuthMiddleware } from "./auth.js";
import { registerBoardHandlers } from "./handlers.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

export type AppIO = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: AppIO | null = null;

export function initSocket(httpServer: HttpServer) {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: env.frontendOrigins,
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(
      `[socket] connected user=${socket.data.user.id} id=${socket.id}`
    );

    registerBoardHandlers(socket);

    socket.on("disconnect", (reason) => {
      console.log(
        `[socket] disconnected user=${socket.data.user.id} id=${socket.id} reason=${reason}`
      );
    });
  });

  return io;
}

export function getIO() {
  return io;
}
