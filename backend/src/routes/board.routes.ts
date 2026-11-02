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
  requireWorkspaceMember,
} from "../middleware/workspace.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createBoardSchema,
  updateBoardSchema,
} from "../utils/validation.js";

const router = Router();

router.post(
  "/workspaces/:workspaceId/boards",
  authMiddleware,
  requireWorkspaceMember,
  validate(createBoardSchema),
  createBoardController
);

router.get(
  "/workspaces/:workspaceId/boards",
  authMiddleware,
  requireWorkspaceMember,
  getWorkspaceBoardsController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId",
  authMiddleware,
  requireWorkspaceMember,
  getBoardController
);

router.patch(
  "/workspaces/:workspaceId/boards/:boardId",
  authMiddleware,
  requireWorkspaceMember,
  validate(updateBoardSchema),
  updateBoardController
);

router.delete(
  "/workspaces/:workspaceId/boards/:boardId",
  authMiddleware,
  requireWorkspaceMember,
  deleteBoardController
);

export default router;