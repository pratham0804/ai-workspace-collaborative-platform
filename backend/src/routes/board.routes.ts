import { Router } from "express";

import {
  createBoardController,
  getWorkspaceBoardsController,
  getBoardController,
  updateBoardController,
  deleteBoardController,
} from "../controllers/board.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

import {
  requireIntegerParams,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
} from "../middleware/workspace.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createBoardSchema,
  updateBoardSchema,
} from "../utils/validation.js";

const router = Router();

const workspaceIds = requireIntegerParams("workspaceId");
const boardIds = requireIntegerParams("workspaceId", "boardId");

router.post(
  "/workspaces/:workspaceId/boards",
  workspaceIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(createBoardSchema),
  createBoardController
);

router.get(
  "/workspaces/:workspaceId/boards",
  workspaceIds,
  authMiddleware,
  requireWorkspaceMember,
  getWorkspaceBoardsController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId",
  boardIds,
  authMiddleware,
  requireWorkspaceMember,
  getBoardController
);

router.patch(
  "/workspaces/:workspaceId/boards/:boardId",
  boardIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(updateBoardSchema),
  updateBoardController
);

router.delete(
  "/workspaces/:workspaceId/boards/:boardId",
  boardIds,
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  deleteBoardController
);

export default router;
