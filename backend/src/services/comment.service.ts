import { prisma } from "../config/prisma.js";

export async function createComment(
  taskId: number,
  userId: number,
  content: string
) {
  return prisma.comment.create({
    data: {
      taskId,
      userId,
      content,
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
  });
}

export async function getTaskComments(taskId: number) {
  return prisma.comment.findMany({
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
      createdAt: "asc",
    },
  });
}

export async function deleteComment(
  commentId: number,
  userId: number
) {
  return prisma.comment.deleteMany({
    where: {
      id: commentId,
      userId,
    },
  });
}