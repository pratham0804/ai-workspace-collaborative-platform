import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import {
  createComment,
  getTaskComments,
  deleteComment,
} from "../services/comment.service.js";

async function validateTaskHierarchy(
  workspaceId: number,
  boardId: number,
  columnId: number,
  taskId: number
) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      columnId,
      column: {
        boardId,
        board: {
          workspaceId,
        },
      },
    },
  });
}

export async function createCommentController(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const task = await validateTaskHierarchy(
      Number(req.params.workspaceId),
      Number(req.params.boardId),
      Number(req.params.columnId),
      Number(req.params.taskId)
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const comment = await createComment(
      task.id,
      req.user.id,
      req.body.content
    );

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
    });
  }
}

export async function getTaskCommentsController(
  req: Request,
  res: Response
) {
  try {
    const task = await validateTaskHierarchy(
      Number(req.params.workspaceId),
      Number(req.params.boardId),
      Number(req.params.columnId),
      Number(req.params.taskId)
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const comments = await getTaskComments(task.id);

    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
    });
  }
}

export async function deleteCommentController(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const task = await validateTaskHierarchy(
      Number(req.params.workspaceId),
      Number(req.params.boardId),
      Number(req.params.columnId),
      Number(req.params.taskId)
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const result = await deleteComment(
      Number(req.params.commentId),
      task.id,
      req.user.id
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you are not the owner",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
    });
  }
}