import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
} from "../services/workspace-member.service.js";

async function requireAdminOrOwner(
  workspaceId: number,
  userId: number
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (
    !membership ||
    (membership.role !== "OWNER" && membership.role !== "ADMIN")
  ) {
    return null;
  }

  return membership;
}

export async function getWorkspaceMembersController(
  req: Request,
  res: Response
) {
  try {
    const members = await getWorkspaceMembers(
      Number(req.params.workspaceId)
    );

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch workspace members",
    });
  }
}

export async function addWorkspaceMemberController(
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

    const workspaceId = Number(req.params.workspaceId);

    const membership = await requireAdminOrOwner(
      workspaceId,
      req.user.id
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Only workspace owners and admins can add members",
      });
    }

    const member = await addWorkspaceMember(
      workspaceId,
      req.body.email,
      req.body.role
    );

    return res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      (
        error.message === "User not found" ||
        error.message === "User is already a workspace member"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add workspace member",
    });
  }
}

export async function updateWorkspaceMemberController(
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

    const workspaceId = Number(req.params.workspaceId);
    const userId = Number(req.params.userId);

    const membership = await requireAdminOrOwner(
      workspaceId,
      req.user.id
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Only workspace owners and admins can update members",
      });
    }

    const target = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (target.role === "OWNER") {
      return res.status(403).json({
        success: false,
        message: "Owner role cannot be changed",
      });
    }

    const result = await updateWorkspaceMemberRole(
      workspaceId,
      userId,
      req.body.role
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update member",
    });
  }
}

export async function removeWorkspaceMemberController(
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

    const workspaceId = Number(req.params.workspaceId);
    const userId = Number(req.params.userId);

    const membership = await requireAdminOrOwner(
      workspaceId,
      req.user.id
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Only workspace owners and admins can remove members",
      });
    }

    const target = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (target.role === "OWNER") {
      return res.status(403).json({
        success: false,
        message: "Workspace owner cannot be removed",
      });
    }

    const result = await removeWorkspaceMember(
      workspaceId,
      userId
    );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove member",
    });
  }
}