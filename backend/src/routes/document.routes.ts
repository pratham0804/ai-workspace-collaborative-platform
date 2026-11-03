import { Router } from "express";
import {
  checkpointDocumentController,
  createDocumentController,
  deleteDocumentController,
  getDocumentController,
  getDocumentVersionController,
  listDocumentVersionsController,
  listDocumentsController,
  restoreDocumentVersionController,
  updateDocumentController,
} from "../controllers/document.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  requireIntegerParams,
  requireWorkspaceMember,
} from "../middleware/workspace.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  checkpointDocumentSchema,
  createDocumentSchema,
  updateDocumentSchema,
} from "../utils/validation.js";

const router = Router();

const workspaceIds = requireIntegerParams("workspaceId");
const documentIds = requireIntegerParams("workspaceId", "documentId");
const versionIds = requireIntegerParams(
  "workspaceId",
  "documentId",
  "versionId"
);

router.post(
  "/workspaces/:workspaceId/documents",
  workspaceIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(createDocumentSchema),
  createDocumentController
);

router.get(
  "/workspaces/:workspaceId/documents",
  workspaceIds,
  authMiddleware,
  requireWorkspaceMember,
  listDocumentsController
);

router.get(
  "/workspaces/:workspaceId/documents/:documentId/versions",
  documentIds,
  authMiddleware,
  requireWorkspaceMember,
  listDocumentVersionsController
);

router.get(
  "/workspaces/:workspaceId/documents/:documentId/versions/:versionId",
  versionIds,
  authMiddleware,
  requireWorkspaceMember,
  getDocumentVersionController
);

router.post(
  "/workspaces/:workspaceId/documents/:documentId/versions/:versionId/restore",
  versionIds,
  authMiddleware,
  requireWorkspaceMember,
  restoreDocumentVersionController
);

router.get(
  "/workspaces/:workspaceId/documents/:documentId",
  documentIds,
  authMiddleware,
  requireWorkspaceMember,
  getDocumentController
);

router.patch(
  "/workspaces/:workspaceId/documents/:documentId",
  documentIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(updateDocumentSchema),
  updateDocumentController
);

router.post(
  "/workspaces/:workspaceId/documents/:documentId/checkpoint",
  documentIds,
  authMiddleware,
  requireWorkspaceMember,
  validate(checkpointDocumentSchema),
  checkpointDocumentController
);

router.delete(
  "/workspaces/:workspaceId/documents/:documentId",
  documentIds,
  authMiddleware,
  requireWorkspaceMember,
  deleteDocumentController
);

export default router;
