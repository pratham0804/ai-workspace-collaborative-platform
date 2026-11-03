import type { Request, Response } from "express";
import {
  DocumentServiceError,
  createDocument,
  deleteDocument,
  getDocument,
  getDocumentVersion,
  listDocumentVersions,
  listDocuments,
  restoreDocumentVersion,
  searchDocuments,
  updateDocument,
} from "../services/document.service.js";

function handleError(error: unknown, res: Response, fallback: string) {
  if (error instanceof DocumentServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: fallback,
  });
}

export async function createDocumentController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const document = await createDocument(
      Number(req.params.workspaceId),
      req.user.id,
      req.body.title,
      req.body.parentId ?? null
    );

    return res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    return handleError(error, res, "Failed to create document");
  }
}

export async function listDocumentsController(req: Request, res: Response) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const documents = query
      ? await searchDocuments(workspaceId, query)
      : await listDocuments(workspaceId);

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    return handleError(error, res, "Failed to fetch documents");
  }
}

export async function getDocumentController(req: Request, res: Response) {
  try {
    const document = await getDocument(
      Number(req.params.workspaceId),
      Number(req.params.documentId)
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    return handleError(error, res, "Failed to fetch document");
  }
}

export async function updateDocumentController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const document = await updateDocument(
      Number(req.params.workspaceId),
      Number(req.params.documentId),
      req.user.id,
      {
        title: req.body.title,
        parentId: req.body.parentId,
        content: req.body.content,
        changeSummary: req.body.changeSummary,
      }
    );

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    return handleError(error, res, "Failed to update document");
  }
}

export async function deleteDocumentController(req: Request, res: Response) {
  try {
    await deleteDocument(
      Number(req.params.workspaceId),
      Number(req.params.documentId)
    );

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    return handleError(error, res, "Failed to delete document");
  }
}

export async function listDocumentVersionsController(
  req: Request,
  res: Response
) {
  try {
    const versions = await listDocumentVersions(
      Number(req.params.workspaceId),
      Number(req.params.documentId)
    );

    return res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (error) {
    return handleError(error, res, "Failed to fetch document versions");
  }
}

export async function getDocumentVersionController(
  req: Request,
  res: Response
) {
  try {
    const version = await getDocumentVersion(
      Number(req.params.workspaceId),
      Number(req.params.documentId),
      Number(req.params.versionId)
    );

    return res.status(200).json({
      success: true,
      data: version,
    });
  } catch (error) {
    return handleError(error, res, "Failed to fetch document version");
  }
}

export async function restoreDocumentVersionController(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const document = await restoreDocumentVersion(
      Number(req.params.workspaceId),
      Number(req.params.documentId),
      Number(req.params.versionId),
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    return handleError(error, res, "Failed to restore document version");
  }
}
