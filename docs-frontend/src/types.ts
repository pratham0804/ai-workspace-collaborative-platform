export interface Workspace {
  id: number;
  name: string;
  ownerId: number;
}

export interface DocumentSummary {
  id: number;
  title: string;
  parentId: number | null;
  workspaceId: number;
  updatedAt: string;
  createdAt?: string;
  contentText?: string;
}

export interface DocumentRecord extends DocumentSummary {
  content: unknown;
  contentText: string;
  createdBy?: { id: number; name: string; email: string };
  updatedBy?: { id: number; name: string; email: string };
}

export interface DocumentVersionSummary {
  id: number;
  documentId: number;
  versionNumber: number;
  title: string;
  changeSummary: string | null;
  createdAt: string;
  author: { id: number; name: string; email: string };
}

export interface DocumentVersionRecord extends DocumentVersionSummary {
  content: unknown;
  contentText: string;
}

export interface DocumentNode extends DocumentSummary {
  children: DocumentNode[];
}

export function buildDocumentTree(documents: DocumentSummary[]): DocumentNode[] {
  const nodes = new Map<number, DocumentNode>();

  for (const document of documents) {
    nodes.set(document.id, { ...document, children: [] });
  }

  const roots: DocumentNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
