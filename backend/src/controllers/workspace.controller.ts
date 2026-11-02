import type { Request, Response } from "express";

import {
  createWorkspace,
  getUserWorkspaces,
} from "../services/workspace.service.js";

export async function createWorkspaceController(
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

    const { name } = req.body;

    const workspace = await createWorkspace(
      name,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create workspace",
    });
  }
}

export async function getWorkspacesController(
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

    const workspaces = await getUserWorkspaces(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch workspaces",
    });
  }
}