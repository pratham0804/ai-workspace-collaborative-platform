import { Router } from "express";

import {
  createColumnController,
  getBoardColumnsController,
  getColumnController,
  updateColumnController,
  deleteColumnController,
} from "../controllers/column.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  requireWorkspaceMember,
} from "../middleware/workspace.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createColumnSchema,
  updateColumnSchema,
} from "../utils/validation.js";

const router = Router();

router.post(
  "/workspaces/:workspaceId/boards/:boardId/columns",
  authMiddleware,
  requireWorkspaceMember,
  validate(createColumnSchema),
  createColumnController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns",
  authMiddleware,
  requireWorkspaceMember,
  getBoardColumnsController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId",
  authMiddleware,
  requireWorkspaceMember,
  getColumnController
);

router.patch(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId",
  authMiddleware,
  requireWorkspaceMember,
  validate(updateColumnSchema),
  updateColumnController
);

router.delete(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId",
  authMiddleware,
  requireWorkspaceMember,
  deleteColumnController
);

export default router;