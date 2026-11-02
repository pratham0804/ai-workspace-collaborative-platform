import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";

import {
  createTask,
  getColumnTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../services/task.service.js";

async function validateHierarchy(
  workspaceId: number,
  boardId: number,
  columnId: number
) {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      boardId,
      board: {
        workspaceId,
      },
    },
  });

  return column;
}

export async function createTaskController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const column = await validateHierarchy(
      workspaceId,
      boardId,
      columnId
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    const task = await createTask(
      req.body.title,
      req.body.description,
      req.body.priority,
      columnId
    );

    return res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
}

export async function getColumnTasksController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const column = await validateHierarchy(
      workspaceId,
      boardId,
      columnId
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    const tasks = await getColumnTasks(columnId);

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
}

export async function getTaskController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const taskId = Number(
      req.params.taskId
    );

    const column = await validateHierarchy(
      workspaceId,
      boardId,
      columnId
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    const task = await getTaskById(
      taskId,
      columnId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch task",
    });
  }
}

export async function updateTaskController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const taskId = Number(
      req.params.taskId
    );

    const column = await validateHierarchy(
      workspaceId,
      boardId,
      columnId
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    const result = await updateTask(
      taskId,
      columnId,
      req.body
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const updatedTask = await getTaskById(
      taskId,
      columnId
    );

    return res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
}

export async function deleteTaskController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(
      req.params.workspaceId
    );

    const boardId = Number(
      req.params.boardId
    );

    const columnId = Number(
      req.params.columnId
    );

    const taskId = Number(
      req.params.taskId
    );

    const column = await validateHierarchy(
      workspaceId,
      boardId,
      columnId
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    const result = await deleteTask(
      taskId,
      columnId
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
}