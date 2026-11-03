// Types for API data
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Workspace {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: number;
  name: string;
  workspaceId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: number;
  name: string;
  boardId: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  columnId: number;
  position: number;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  taskId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: number;
  taskId: number;
  userId: number;
  action: string;
  fromColumnId?: number;
  toColumnId?: number;
  details?: string;
  createdAt: string;
}
