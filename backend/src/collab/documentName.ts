export function collaborationDocumentName(
  documentId: number,
  generation: number
) {
  return `document:${documentId}:g${generation}`;
}

export function parseCollaborationDocumentName(name: string) {
  const match = /^document:(\d+):g(\d+)$/.exec(name);

  if (!match) {
    return null;
  }

  const documentId = Number(match[1]);
  const generation = Number(match[2]);

  if (!Number.isInteger(documentId) || documentId <= 0) {
    return null;
  }

  if (!Number.isInteger(generation) || generation <= 0) {
    return null;
  }

  return { documentId, generation };
}
