import { Router } from "express";
import {
  getWorkspaceMembersController,
  addWorkspaceMemberController,
  updateWorkspaceMemberController,
  removeWorkspaceMemberController,
} from "../controllers/workspace-member.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  requireIntegerParams,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
} from "../middleware/workspace.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
} from "../utils/validation.js";

const router = Router();

const workspaceIds = requireIntegerParams("workspaceId");
const memberIds = requireIntegerParams("workspaceId", "userId");

router.get(
  "/workspaces/:workspaceId/members",
  workspaceIds,
  authMiddleware,
  requireWorkspaceMember,
  getWorkspaceMembersController
);

router.post(
  "/workspaces/:workspaceId/members",
  workspaceIds,
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  validate(addWorkspaceMemberSchema),
  addWorkspaceMemberController
);

router.patch(
  "/workspaces/:workspaceId/members/:userId",
  memberIds,
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  validate(updateWorkspaceMemberSchema),
  updateWorkspaceMemberController
);

router.delete(
  "/workspaces/:workspaceId/members/:userId",
  memberIds,
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceAdmin,
  removeWorkspaceMemberController
);

export default router;
