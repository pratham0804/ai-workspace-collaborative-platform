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
  requireIntegerParams,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
} from "../middleware/workspace.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createColumnSchema,
  updateColumnSchema,
} from "../utils/validation.js";

const router = Router();

const boardIds = requireIntegerParams("workspaceId", "boardId");
const columnIds = requireIntegerParams(
  "workspaceId",
  "boardId",
  "columnId"
);

router.post(
  "/workspaces/:workspaceId/boards/:boardId/columns",
  boardIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(createColumnSchema),
  createColumnController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns",
  boardIds,
  authMiddleware,
  requireWorkspaceMember,
  getBoardColumnsController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId",
  columnIds,
  authMiddleware,
  requireWorkspaceMember,
  getColumnController
);

router.patch(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId",
  columnIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(updateColumnSchema),
  updateColumnController
);

router.delete(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId",
  columnIds,
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  deleteColumnController
);

export default router;
