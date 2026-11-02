import { string, ZodCompileUnsupportedError } from "zod";
import { prisma } from "../config/prisma.js";

export async function createTask(
  title: string,
  description: string | undefined,
  priority: string | undefined,
  columnId: number
) {
  const lastTask = await prisma.task.findFirst({
    where: {
      columnId,
    },
    orderBy: {
      position: "desc",
    },
  });

  const position = lastTask
    ? lastTask.position + 1
    : 0;

  return prisma.task.create({
    data: {
      title,
      description : description ?? null,
      priority: priority ?? "MEDIUM",
      columnId,
      position,
    },
  });
}

export async function getColumnTasks(
  columnId: number
) {
  return prisma.task.findMany({
    where: {
      columnId,
    },
    orderBy: {
      position: "asc",
    },
  });
}

export async function getTaskById(
  taskId: number,
  columnId: number
) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      columnId,
    },
  });
}

export async function updateTask(
  taskId: number,
  columnId: number,
  data: {
    title?: string;
    description?: string;
    priority?: string;
  }
) {
  return prisma.task.updateMany({
    where: {
      id: taskId,
      columnId,
    },
    data,
  });
}

export async function deleteTask(
  taskId: number,
  columnId: number
) {
  return prisma.task.deleteMany({
    where: {
      id: taskId,
      columnId,
    },
  });
}