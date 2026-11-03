import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const EMPTY_DOC_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export class DocumentServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

type JsonNode = {
  text?: string;
  content?: JsonNode[];
};

export function extractContentText(content: unknown): string {
  function walk(node: unknown): string[] {
    if (!node || typeof node !== "object") {
      return [];
    }

    const value = node as JsonNode;
    const parts: string[] = [];

    if (typeof value.text === "string" && value.text.length > 0) {
      parts.push(value.text);
    }

    if (Array.isArray(value.content)) {
      for (const child of value.content) {
        parts.push(...walk(child));
      }
    }

    return parts;
  }

  return walk(content).join(" ").replace(/\s+/g, " ").trim();
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function getNextVersionNumber(
  tx: Prisma.TransactionClient,
  documentId: number
) {
  const last = await tx.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });

  return last ? last.versionNumber + 1 : 1;
}

async function createVersion(
  tx: Prisma.TransactionClient,
  data: {
    documentId: number;
    title: string;
    content: Prisma.InputJsonValue;
    contentText: string;
    authorId: number;
    changeSummary: string | null;
  }
) {
  const versionNumber = await getNextVersionNumber(tx, data.documentId);

  return tx.documentVersion.create({
    data: {
      documentId: data.documentId,
      versionNumber,
      title: data.title,
      content: data.content,
      contentText: data.contentText,
      authorId: data.authorId,
      changeSummary: data.changeSummary,
    },
  });
}

async function runVersionedTransaction<T>(
  work: () => Promise<T>
) {
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await work();
    } catch (error) {
      const isUniqueConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isUniqueConflict || attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new DocumentServiceError("Failed to save document version", 500);
}

async function assertParent(
  workspaceId: number,
  parentId: number | null,
  documentId?: number
) {
  if (parentId === null) {
    return;
  }

  if (documentId && parentId === documentId) {
    throw new DocumentServiceError("A document cannot be its own parent", 400);
  }

  const parent = await prisma.document.findFirst({
    where: {
      id: parentId,
      workspaceId,
    },
    select: {
      id: true,
      parentId: true,
      workspaceId: true,
    },
  });

  if (!parent) {
    throw new DocumentServiceError("Parent document not found", 404);
  }

  if (documentId) {
    let current: number | null = parentId;
    const seen = new Set<number>();

    while (current) {
      if (current === documentId) {
        throw new DocumentServiceError(
          "Cannot create a circular document hierarchy",
          400
        );
      }

      if (seen.has(current)) {
        throw new DocumentServiceError(
          "Cannot create a circular document hierarchy",
          400
        );
      }

      seen.add(current);

      const node: { parentId: number | null } | null =
        await prisma.document.findUnique({
          where: { id: current },
          select: { parentId: true },
        });

      current = node?.parentId ?? null;
    }
  }
}

const documentInclude = {
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  updatedBy: {
    select: { id: true, name: true, email: true },
  },
};

export async function createDocument(
  workspaceId: number,
  userId: number,
  title: string,
  parentId: number | null
) {
  await assertParent(workspaceId, parentId);

  const content = EMPTY_DOC_CONTENT;
  const contentText = "";

  return runVersionedTransaction(() =>
    prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        title,
        content,
        contentText,
        workspaceId,
        parentId,
        createdById: userId,
        updatedById: userId,
      },
      include: documentInclude,
    });

    await createVersion(tx, {
      documentId: document.id,
      title: document.title,
      content,
      contentText,
      authorId: userId,
      changeSummary: "Created document",
    });

    return document;
  })
  );
}

export async function listDocuments(workspaceId: number) {
  return prisma.document.findMany({
    where: { workspaceId },
    orderBy: [{ title: "asc" }],
    select: {
      id: true,
      title: true,
      parentId: true,
      workspaceId: true,
      updatedAt: true,
      createdAt: true,
      updatedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function searchDocuments(workspaceId: number, query: string) {
  return prisma.document.findMany({
    where: {
      workspaceId,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { contentText: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      parentId: true,
      workspaceId: true,
      contentText: true,
      updatedAt: true,
    },
    take: 50,
  });
}

export async function getDocument(workspaceId: number, documentId: number) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
    include: documentInclude,
  });
}

export async function updateDocument(
  workspaceId: number,
  documentId: number,
  userId: number,
  data: {
    title?: string;
    parentId?: number | null;
    content?: unknown;
    changeSummary?: string;
  }
) {
  const existing = await getDocument(workspaceId, documentId);

  if (!existing) {
    throw new DocumentServiceError("Document not found", 404);
  }

  const nextTitle = data.title ?? existing.title;
  const nextParentId =
    data.parentId === undefined ? existing.parentId : data.parentId;
  const nextContent =
    data.content === undefined ? existing.content : data.content;
  const nextContentText =
    data.content === undefined
      ? existing.contentText
      : extractContentText(data.content);

  if (nextParentId !== existing.parentId) {
    await assertParent(workspaceId, nextParentId, documentId);
  }

  const contentChanged = !sameJson(existing.content, nextContent);
  const titleChanged = nextTitle !== existing.title;
  const parentChanged = nextParentId !== existing.parentId;

  if (!contentChanged && !titleChanged && !parentChanged) {
    return existing;
  }

  const shouldSnapshot = contentChanged || titleChanged;

  return runVersionedTransaction(() =>
    prisma.$transaction(async (tx) => {
    const document = await tx.document.update({
      where: { id: documentId },
      data: {
        title: nextTitle,
        parentId: nextParentId,
        content: nextContent as Prisma.InputJsonValue,
        contentText: nextContentText,
        updatedById: userId,
      },
      include: documentInclude,
    });

    if (shouldSnapshot) {
      await createVersion(tx, {
        documentId,
        title: document.title,
        content: document.content as Prisma.InputJsonValue,
        contentText: document.contentText,
        authorId: userId,
        changeSummary:
          data.changeSummary ??
          (titleChanged && contentChanged
            ? "Updated title and content"
            : titleChanged
              ? "Renamed document"
              : "Updated content"),
      });
    }

    return document;
  })
  );
}

export async function deleteDocument(workspaceId: number, documentId: number) {
  const existing = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
    include: {
      _count: {
        select: { children: true },
      },
    },
  });

  if (!existing) {
    throw new DocumentServiceError("Document not found", 404);
  }

  if (existing._count.children > 0) {
    throw new DocumentServiceError(
      "Move or delete child pages before deleting this document",
      409
    );
  }

  await prisma.document.delete({
    where: { id: documentId },
  });
}

export async function listDocumentVersions(
  workspaceId: number,
  documentId: number
) {
  const document = await getDocument(workspaceId, documentId);

  if (!document) {
    throw new DocumentServiceError("Document not found", 404);
  }

  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      documentId: true,
      versionNumber: true,
      title: true,
      changeSummary: true,
      createdAt: true,
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getDocumentVersion(
  workspaceId: number,
  documentId: number,
  versionId: number
) {
  const document = await getDocument(workspaceId, documentId);

  if (!document) {
    throw new DocumentServiceError("Document not found", 404);
  }

  const version = await prisma.documentVersion.findFirst({
    where: {
      id: versionId,
      documentId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!version) {
    throw new DocumentServiceError("Version not found", 404);
  }

  return version;
}

export async function restoreDocumentVersion(
  workspaceId: number,
  documentId: number,
  versionId: number,
  userId: number
) {
  const version = await getDocumentVersion(
    workspaceId,
    documentId,
    versionId
  );

  return runVersionedTransaction(() =>
    prisma.$transaction(async (tx) => {
    const document = await tx.document.update({
      where: { id: documentId },
      data: {
        title: version.title,
        content: version.content as Prisma.InputJsonValue,
        contentText: version.contentText,
        updatedById: userId,
      },
      include: documentInclude,
    });

    await createVersion(tx, {
      documentId,
      title: document.title,
      content: document.content as Prisma.InputJsonValue,
      contentText: document.contentText,
      authorId: userId,
      changeSummary: `Restored from version ${version.versionNumber}`,
    });

    return document;
  })
  );
}
