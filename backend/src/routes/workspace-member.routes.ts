import { Router } from "express";
import {
  getWorkspaceMembersController,
  addWorkspaceMemberController,
  updateWorkspaceMemberController,
  removeWorkspaceMemberController,
} from "../controllers/workspace-member.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireWorkspaceMember } from "../middleware/workspace.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
} from "../utils/validation.js";

const router = Router();

router.get(
  "/workspaces/:workspaceId/members",
  authMiddleware,
  requireWorkspaceMember,
  getWorkspaceMembersController
);

router.post(
  "/workspaces/:workspaceId/members",
  authMiddleware,
  requireWorkspaceMember,
  validate(addWorkspaceMemberSchema),
  addWorkspaceMemberController
);

router.patch(
  "/workspaces/:workspaceId/members/:userId",
  authMiddleware,
  requireWorkspaceMember,
  validate(updateWorkspaceMemberSchema),
  updateWorkspaceMemberController
);

router.delete(
  "/workspaces/:workspaceId/members/:userId",
  authMiddleware,
  requireWorkspaceMember,
  removeWorkspaceMemberController
);

export default router;