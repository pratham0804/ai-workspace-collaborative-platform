import type { Request, Response } from "express";

import { prisma } from "../config/prisma.js";

import {
  createTask,
  getColumnTasks,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
} from "../services/task.service.js";

import { getTaskHistory } from "../services/task-history.service.js";
import { broadcastBoardEvent } from "../services/realtime.service.js";

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

    if (!req.user) {
      return res.status(401).json({
      success: false,
      message: "Authentication required",
    });


}

    const task = await createTask(
      req.body.title,
      req.body.description,
      req.body.priority,
      columnId,
      req.user.id
    );

    broadcastBoardEvent(
      "task:created",
      workspaceId,
      column.boardId,
      req.user.id,
      task
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
      columnId,
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        message: "Column not found",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await updateTask(
      taskId,
      columnId,
      req.body,
      req.user.id,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const updatedTask = await getTaskById(
      taskId,
      columnId
    );

    broadcastBoardEvent(
      "task:updated",
      workspaceId,
      column.boardId,
      req.user.id,
      updatedTask
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

    if (req.user) {
      broadcastBoardEvent(
        "task:deleted",
        workspaceId,
        column.boardId,
        req.user.id,
        {
          id: taskId,
          columnId,
        }
      );
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


export async function moveTaskController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const boardId = Number(req.params.boardId);
    const sourceColumnId = Number(req.params.columnId);
    const taskId = Number(req.params.taskId);

    const targetColumnId = req.body.targetColumnId;
    const targetPosition = req.body.targetPosition;

    const sourceColumn = await validateHierarchy(
      workspaceId,
      boardId,
      sourceColumnId
    );

    if (!sourceColumn) {
      return res.status(404).json({
        success: false,
        message: "Source column not found",
      });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        columnId: sourceColumnId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const targetColumn = await prisma.column.findFirst({
      where: {
        id: targetColumnId,
        boardId,
        board: {
          workspaceId,
        },
      },
    });

    if (!targetColumn) {
      return res.status(404).json({
        success: false,
        message: "Target column not found",
      });
    }

     if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const movedTask = await moveTask(
      taskId,
      sourceColumnId,
      targetColumnId,
      targetPosition,
      req.user.id
    );

    broadcastBoardEvent(
      "task:moved",
      workspaceId,
      sourceColumn.boardId,
      req.user.id,
      {
        task: movedTask,
        sourceColumnId,
        targetColumnId,
        targetPosition,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Task moved successfully",
      data: movedTask,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "Invalid target position"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to move task",
    });
  }
}


export async function getTaskHistoryController(
  req: Request,
  res: Response
) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const boardId = Number(req.params.boardId);
    const columnId = Number(req.params.columnId);
    const taskId = Number(req.params.taskId);

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

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        columnId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const history = await getTaskHistory(taskId);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch task history",
    });
  }
}