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
  tasks?: Task[];
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  columnId: number;
  position: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
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
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TaskHistory {
  id: number;
  taskId: number;
  userId: number;
  action: string;
  fromColumnId: number | null;
  toColumnId: number | null;
  details: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}