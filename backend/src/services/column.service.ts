import { prisma } from "../config/prisma.js";

export async function createColumn(
  name: string,
  boardId: number
) {
  const lastColumn = await prisma.column.findFirst({
    where: {
      boardId,
    },
    orderBy: {
      position: "desc",
    },
  });

  const position = lastColumn
    ? lastColumn.position + 1
    : 0;

  return prisma.column.create({
    data: {
      name,
      boardId,
      position,
    },
  });
}

export async function getBoardColumns(
  boardId: number
) {
  return prisma.column.findMany({
    where: {
      boardId,
    },
    orderBy: {
      position: "asc",
    },
  });
}

export async function getColumnById(
  columnId: number,
  boardId: number
) {
  return prisma.column.findFirst({
    where: {
      id: columnId,
      boardId,
    },
  });
}

export async function updateColumn(
  columnId: number,
  boardId: number,
  name: string
) {
  return prisma.column.updateMany({
    where: {
      id: columnId,
      boardId,
    },
    data: {
      name,
    },
  });
}

export async function deleteColumn(
  columnId: number,
  boardId: number
) {
  return prisma.column.deleteMany({
    where: {
      id: columnId,
      boardId,
    },
  });
}