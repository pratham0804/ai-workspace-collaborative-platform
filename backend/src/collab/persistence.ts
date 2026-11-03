import * as Y from "yjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  EMPTY_DOC_CONTENT,
  encodeTiptapJson,
  ydocToTiptapJson,
  yjsStateToTiptapJson,
} from "./tiptap.js";

const locks = new Map<number, Promise<unknown>>();

async function withDocumentLock<T>(
  documentId: number,
  work: () => Promise<T>
) {
  const previous = locks.get(documentId) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const current = previous.then(() => gate);
  locks.set(documentId, current);

  await previous;

  try {
    return await work();
  } finally {
    release();
    if (locks.get(documentId) === current) {
      locks.delete(documentId);
    }
  }
}

export async function loadYjsState(
  documentId: number,
  generation: number
) {
  return withDocumentLock(documentId, async () => {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { collaborationState: true },
    });

    if (!document) {
      return null;
    }

    if (document.collaborationGeneration !== generation) {
      return null;
    }

    if (document.collaborationState) {
      if (document.collaborationState.generation !== generation) {
        return null;
      }

      return new Uint8Array(document.collaborationState.yjsState);
    }

    const state = encodeTiptapJson(document.content ?? EMPTY_DOC_CONTENT);

    try {
      await prisma.documentCollaborationState.create({
        data: {
          documentId,
          yjsState: Buffer.from(state),
          generation: document.collaborationGeneration,
        },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }

      const existing = await prisma.documentCollaborationState.findUnique({
        where: { documentId },
      });

      if (existing && existing.generation === generation) {
        return new Uint8Array(existing.yjsState);
      }

      return null;
    }

    return state;
  });
}

export async function storeYjsState(
  documentId: number,
  generation: number,
  state: Uint8Array
) {
  return withDocumentLock(documentId, async () => {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        collaborationGeneration: true,
        collaborationState: {
          select: { generation: true },
        },
      },
    });

    if (!document || document.collaborationGeneration !== generation) {
      return false;
    }

    if (
      document.collaborationState &&
      document.collaborationState.generation !== generation
    ) {
      return false;
    }

    await prisma.documentCollaborationState.upsert({
      where: { documentId },
      create: {
        documentId,
        yjsState: Buffer.from(state),
        generation,
      },
      update: {
        yjsState: Buffer.from(state),
        generation,
      },
    });

    return true;
  });
}

export async function replaceYjsState(
  documentId: number,
  generation: number,
  content: unknown
) {
  const state = encodeTiptapJson(content ?? EMPTY_DOC_CONTENT);

  await prisma.documentCollaborationState.upsert({
    where: { documentId },
    create: {
      documentId,
      yjsState: Buffer.from(state),
      generation,
    },
    update: {
      yjsState: Buffer.from(state),
      generation,
    },
  });

  return state;
}

export { ydocToTiptapJson, yjsStateToTiptapJson };
