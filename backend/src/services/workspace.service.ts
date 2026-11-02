import { prisma } from "../config/prisma.js";

export async function createWorkspace(
  name: string,
  ownerId: number
) {
  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name,
        ownerId,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: ownerId,
        role: "OWNER",
      },
    });

    return workspace;
  });
}

export async function getUserWorkspaces(
  userId: number
) {
  return prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}