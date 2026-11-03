import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { prisma } from "../config/prisma.js";

export function parsePositiveIntParam(
  value: string | undefined
): number | null {
  if (value === undefined) {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export function requireIntegerParams(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const name of paramNames) {
      if (req.params[name] === undefined) {
        continue;
      }

      const id = parsePositiveIntParam(req.params[name]);

      if (id === null) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${name}`,
        });
      }
    }

    next();
  };
}

export function requireWorkspaceAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const role = req.workspaceMembership?.role;

  if (role !== "OWNER" && role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message:
        "Only workspace owners and admins can perform this action",
    });
  }

  next();
}

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

    const workspaceId = parsePositiveIntParam(
      req.params.workspaceId
    );

    if (workspaceId === null) {
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