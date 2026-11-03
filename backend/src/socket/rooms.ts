export function workspaceRoom(workspaceId: number) {
  return `workspace:${workspaceId}`;
}

export function boardRoom(boardId: number) {
  return `board:${boardId}`;
}

export function parsePositiveInt(value: unknown): number | null {
  const id = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}
