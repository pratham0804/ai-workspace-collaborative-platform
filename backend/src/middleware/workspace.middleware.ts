import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../config/prisma.js";

export async function requireWorkspaceMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const workspaceId = Number(
      req.params.workspaceId
    );

    if (!Number.isInteger(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    const membership =
      await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id,
          },
        },
      });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this workspace",
      });
    }

    req.workspaceMembership = membership;

    next();
  } catch (error) {
    next(error);
  }
}