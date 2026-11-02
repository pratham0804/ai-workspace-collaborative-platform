import { Router } from "express";

import {
  createTaskController,
  getColumnTasksController,
  getTaskController,
  updateTaskController,
  deleteTaskController,
} from "../controllers/task.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  requireWorkspaceMember,
} from "../middleware/workspace.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createTaskSchema,
  updateTaskSchema,
} from "../utils/validation.js";

const router = Router();

router.post(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks",
  authMiddleware,
  requireWorkspaceMember,
  validate(createTaskSchema),
  createTaskController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks",
  authMiddleware,
  requireWorkspaceMember,
  getColumnTasksController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId",
  authMiddleware,
  requireWorkspaceMember,
  getTaskController
);

router.patch(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId",
  authMiddleware,
  requireWorkspaceMember,
  validate(updateTaskSchema),
  updateTaskController
);

router.delete(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId",
  authMiddleware,
  requireWorkspaceMember,
  deleteTaskController
);

export default router;