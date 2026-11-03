import * as Y from "yjs";
import { Server } from "@hocuspocus/server";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { getUserFromAccessToken } from "../utils/access-token.js";
import {
  collaborationDocumentName,
  parseCollaborationDocumentName,
} from "./documentName.js";
import { loadYjsState, storeYjsState } from "./persistence.js";

const USER_COLORS = [
  "#0052CC",
  "#DE350B",
  "#00875A",
  "#FF8B00",
  "#5243AA",
  "#00A3BF",
  "#FF5630",
  "#6554C0",
];

export type CollabUser = {
  id: number;
  name: string;
  email: string;
  color: string;
};

export type CollabContext = {
  user: CollabUser;
  documentId: number;
  workspaceId: number;
  generation: number;
};

let collabServer: Server<CollabContext> | null = null;

export function userColor(userId: number) {
  return USER_COLORS[userId % USER_COLORS.length] ?? "#0052CC";
}

export function getHocuspocus() {
  return collabServer?.hocuspocus ?? null;
}

export function closeCollaborationDocument(
  documentId: number,
  generation: number
) {
  collabServer?.hocuspocus.closeConnections(
    collaborationDocumentName(documentId, generation)
  );
}

export function notifyCollaborationDocument(
  documentId: number,
  generation: number,
  payload: Record<string, unknown>
) {
  const document = collabServer?.hocuspocus.documents.get(
    collaborationDocumentName(documentId, generation)
  );

  document?.broadcastStateless(JSON.stringify(payload));
}

export function getLoadedCollaborationDoc(
  documentId: number,
  generation: number
) {
  return (
    collabServer?.hocuspocus.documents.get(
      collaborationDocumentName(documentId, generation)
    ) ?? null
  );
}

async function authorizeDocumentAccess(
  token: string,
  documentName: string
): Promise<CollabContext> {
  if (token.length === 0) {
    throw new Error("Access token is required");
  }

  const parsed = parseCollaborationDocumentName(documentName);
  if (!parsed) {
    throw new Error("Invalid collaboration document");
  }

  let user;
  try {
    user = await getUserFromAccessToken(token);
  } catch {
    throw new Error("Invalid or expired access token");
  }

  const document = await prisma.document.findUnique({
    where: { id: parsed.documentId },
    select: {
      id: true,
      workspaceId: true,
      collaborationGeneration: true,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.collaborationGeneration !== parsed.generation) {
    throw new Error("Stale collaboration session");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: document.workspaceId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this workspace");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      color: userColor(user.id),
    },
    documentId: document.id,
    workspaceId: document.workspaceId,
    generation: parsed.generation,
  };
}

export function startCollaborationServer() {
  collabServer = new Server<CollabContext>({
    port: env.hocuspocusPort,
    debounce: 2000,
    maxDebounce: 10000,
    quiet: true,
    async onAuthenticate({ token, documentName }) {
      return authorizeDocumentAccess(token, documentName);
    },
    async onTokenSync({ token, documentName, context }) {
      const next = await authorizeDocumentAccess(token, documentName);

      context.user = next.user;
      context.documentId = next.documentId;
      context.workspaceId = next.workspaceId;
      context.generation = next.generation;
    },
    async beforeHandleAwareness({ context, connection, document, states }) {
      if (!context?.user || !connection) {
        return;
      }

      const ownedClients = document.getClients(connection);

      for (const [clientId, state] of states) {
        if (ownedClients.size > 0 && !ownedClients.has(clientId)) {
          states.delete(clientId);
          continue;
        }

        states.set(clientId, {
          ...state,
          user: context.user,
          name: context.user.name,
          color: context.user.color,
        });
      }
    },
    async onLoadDocument({ documentName, document }) {
      const parsed = parseCollaborationDocumentName(documentName);
      if (!parsed) {
        throw new Error("Invalid collaboration document");
      }

      const state = await loadYjsState(parsed.documentId, parsed.generation);
      if (!state) {
        throw new Error("Collaboration state is unavailable");
      }

      Y.applyUpdate(document, state);
      return document;
    },
    async onStoreDocument({ documentName, document }) {
      const parsed = parseCollaborationDocumentName(documentName);
      if (!parsed) {
        return;
      }

      const state = Y.encodeStateAsUpdate(document);
      await storeYjsState(parsed.documentId, parsed.generation, state);
    },
  });

  void collabServer.listen().then(() => {
    console.log(
      `Hocuspocus collaboration server running on ws://localhost:${env.hocuspocusPort}`
    );
  });

  return collabServer;
}
