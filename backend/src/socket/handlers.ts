import type { Socket } from "socket.io";
import { prisma } from "../config/prisma.js";
import { boardRoom, parsePositiveInt, workspaceRoom } from "./rooms.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  JoinAck,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

function ackResult(
  ack: ((result: JoinAck) => void) | undefined,
  result: JoinAck
) {
  ack?.(result);
}

async function leaveCurrentBoard(socket: AppSocket) {
  if (socket.data.boardId) {
    await socket.leave(boardRoom(socket.data.boardId));
  }

  if (socket.data.workspaceId) {
    await socket.leave(workspaceRoom(socket.data.workspaceId));
  }

  socket.data.boardId = undefined;
  socket.data.workspaceId = undefined;
}

export function registerBoardHandlers(socket: AppSocket) {
  socket.on("board:join", async (payload, ack) => {
    const workspaceId = parsePositiveInt(payload?.workspaceId);
    const boardId = parsePositiveInt(payload?.boardId);

    if (workspaceId === null || boardId === null) {
      ackResult(ack, { ok: false, error: "Invalid board or workspace ID" });
      return;
    }

    try {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: socket.data.user.id,
          },
        },
      });

      if (!membership) {
        ackResult(ack, {
          ok: false,
          error: "You are not a member of this workspace",
        });
        return;
      }

      const board = await prisma.board.findFirst({
        where: {
          id: boardId,
          workspaceId,
        },
      });

      if (!board) {
        ackResult(ack, { ok: false, error: "Board not found" });
        return;
      }

      await leaveCurrentBoard(socket);

      await socket.join(workspaceRoom(workspaceId));
      await socket.join(boardRoom(board.id));

      socket.data.workspaceId = workspaceId;
      socket.data.boardId = board.id;

      ackResult(ack, { ok: true });
    } catch (error) {
      console.error("board:join failed", error);
      ackResult(ack, { ok: false, error: "Failed to join board" });
    }
  });

  socket.on("board:leave", async (payload, ack) => {
    const boardId = parsePositiveInt(payload?.boardId);

    if (boardId === null) {
      ackResult(ack, { ok: false, error: "Invalid board ID" });
      return;
    }

    if (socket.data.boardId !== boardId) {
      ackResult(ack, { ok: true });
      return;
    }

    await leaveCurrentBoard(socket);
    ackResult(ack, { ok: true });
  });
}
