import { prisma } from "../config/prisma.js";

export async function getWorkspaceMembers(workspaceId: number) {
  return prisma.workspaceMember.findMany({
    where: {
      workspaceId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function addWorkspaceMember(
  workspaceId: number,
  email: string,
  role: "ADMIN" | "MEMBER"
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    throw new Error("User is already a workspace member");
  }

  return prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: user.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateWorkspaceMemberRole(
  workspaceId: number,
  userId: number,
  role: "ADMIN" | "MEMBER"
) {
  return prisma.workspaceMember.updateMany({
    where: {
      workspaceId,
      userId,
      role: {
        not: "OWNER",
      },
    },
    data: {
      role,
    },
  });
}

export async function removeWorkspaceMember(
  workspaceId: number,
  userId: number
) {
  return prisma.workspaceMember.deleteMany({
    where: {
      workspaceId,
      userId,
      role: {
        not: "OWNER",
      },
    },
  });
}