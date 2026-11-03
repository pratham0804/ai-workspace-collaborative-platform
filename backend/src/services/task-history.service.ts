import { prisma } from "../config/prisma.js";

export async function createTaskHistory(
  taskId: number,
  userId: number,
  action: string,
  details?: string,
  fromColumnId?: number,
  toColumnId?: number
) {
  return prisma.taskHistory.create({
    data: {
      taskId,
      userId,
      action,
      details: details ?? null,
      fromColumnId: fromColumnId ?? null,
      toColumnId: toColumnId ?? null,
    },
  });
}

export async function getTaskHistory(taskId: number) {
  return prisma.taskHistory.findMany({
    where: {
      taskId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}