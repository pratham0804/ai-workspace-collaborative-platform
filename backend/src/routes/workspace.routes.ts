import { Router } from "express";

import {
  createWorkspaceController,
  getWorkspacesController,
} from "../controllers/workspace.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createWorkspaceSchema } from "../utils/validation.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validate(createWorkspaceSchema),
  createWorkspaceController
);

router.get(
  "/",
  authMiddleware,
  getWorkspacesController
);

export default router;