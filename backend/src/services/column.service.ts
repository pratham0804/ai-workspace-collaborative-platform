import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export async function createColumn(
  name: string,
  boardId: number
) {
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const lastColumn = await tx.column.findFirst({
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

        return tx.column.create({
          data: {
            name,
            boardId,
            position,
          },
        });
      });
    } catch (error) {
      const isUniqueConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isUniqueConflict || attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error("Failed to create column");
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