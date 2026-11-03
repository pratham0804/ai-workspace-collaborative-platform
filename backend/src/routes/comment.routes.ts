import { Router } from "express";
import {
  createCommentController,
  getTaskCommentsController,
  deleteCommentController,
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireWorkspaceMember } from "../middleware/workspace.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createCommentSchema } from "../utils/validation.js";

const router = Router();

router.post(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId/comments",
  authMiddleware,
  requireWorkspaceMember,
  validate(createCommentSchema),
  createCommentController
);

router.get(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId/comments",
  authMiddleware,
  requireWorkspaceMember,
  getTaskCommentsController
);

router.delete(
  "/workspaces/:workspaceId/boards/:boardId/columns/:columnId/tasks/:taskId/comments/:commentId",
  authMiddleware,
  requireWorkspaceMember,
  deleteCommentController
);

export default router;