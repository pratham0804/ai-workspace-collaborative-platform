import { prisma } from "../config/prisma.js";

export async function createBoard(
  name: string,
  workspaceId: number
) {
  return prisma.board.create({
    data: {
      name,
      workspaceId,
    },
  });
}

export async function getWorkspaceBoards(
  workspaceId: number
) {
  return prisma.board.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getBoardById(
  boardId: number,
  workspaceId: number
) {
  return prisma.board.findFirst({
    where: {
      id: boardId,
      workspaceId,
    },
  });
}

export async function updateBoard(
  boardId: number,
  workspaceId: number,
  name: string
) {
  return prisma.board.updateMany({
    where: {
      id: boardId,
      workspaceId,
    },
    data: {
      name,
    },
  });
}

export async function deleteBoard(
  boardId: number,
  workspaceId: number
) {
  return prisma.board.deleteMany({
    where: {
      id: boardId,
      workspaceId,
    },
  });
}