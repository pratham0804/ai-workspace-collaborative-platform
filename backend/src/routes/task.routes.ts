import { Router } from "express";

import {
  createTaskController,
  getColumnTasksController,
  getTaskController,
  updateTaskController,
  deleteTaskController,
  moveTaskController,
  getTaskHistoryController,
} from "../controllers/task.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  requireIntegerParams,
  requireWorkspaceMember,
} from "../middleware/workspace.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
} from "../utils/validation.js";

const router = Router();

const columnIds = requireIntegerParams(
  "workspaceId",
  "boardId",
  "columnId"
);
const taskIds = requireIntegerParams(
  "workspaceId",
  "boardId",
  "columnId",
  "taskId"
);

router.post(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks",
  columnIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(createTaskSchema),
  createTaskController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks",
  columnIds,
  authMiddleware,
  requireWorkspaceMember,
  getColumnTasksController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId",
  taskIds,
  authMiddleware,
  requireWorkspaceMember,
  getTaskController
);

router.patch(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId/move",
  taskIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(moveTaskSchema),
  moveTaskController
);

router.patch(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId",
  taskIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(updateTaskSchema),
  updateTaskController
);

router.delete(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId",
  taskIds,
  authMiddleware,
  requireWorkspaceMember,
  deleteTaskController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId/history",
  taskIds,
  authMiddleware,
  requireWorkspaceMember,
  getTaskHistoryController
);

export default router;
