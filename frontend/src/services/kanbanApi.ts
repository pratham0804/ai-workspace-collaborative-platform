import { api } from "./api";
import type {
  Workspace,
  Board,
  Column,
  Task,
  Comment,
  TaskHistory,
} from "../types/kanban";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const workspaceApi = {
  async getAll(): Promise<Workspace[]> {
    const response = await api.get<ApiResponse<Workspace[]>>(
      "/workspaces"
    );

    return response.data;
  },

  async create(name: string): Promise<Workspace> {
    const response = await api.post<ApiResponse<Workspace>>(
      "/workspaces",
      { name }
    );

    return response.data;
  },

  async getMembers(workspaceId: number) {
    const response = await api.get<ApiResponse<any[]>>(
      `/workspaces/${workspaceId}/members`
    );

    return response.data;
  },
};

export const boardApi = {
  async getAll(workspaceId: number): Promise<Board[]> {
    const response = await api.get<ApiResponse<Board[]>>(
      `/workspaces/${workspaceId}/boards`
    );

    return response.data;
  },

  async getOne(
    workspaceId: number,
    boardId: number
  ): Promise<Board> {
    const response = await api.get<ApiResponse<Board>>(
      `/workspaces/${workspaceId}/boards/${boardId}`
    );

    return response.data;
  },

  async create(
    workspaceId: number,
    name: string
  ): Promise<Board> {
    const response = await api.post<ApiResponse<Board>>(
      `/workspaces/${workspaceId}/boards`,
      { name }
    );

    return response.data;
  },

  async update(
    workspaceId: number,
    boardId: number,
    name: string
  ) {
    return api.patch<ApiResponse<any>>(
      `/workspaces/${workspaceId}/boards/${boardId}`,
      { name }
    );
  },

  async delete(
    workspaceId: number,
    boardId: number
  ) {
    return api.delete<ApiResponse<any>>(
      `/workspaces/${workspaceId}/boards/${boardId}`
    );
  },
};

export const columnApi = {
  async getAll(
    workspaceId: number,
    boardId: number
  ): Promise<Column[]> {
    const response = await api.get<ApiResponse<Column[]>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns`
    );

    return response.data;
  },

  async getOne(
    workspaceId: number,
    boardId: number,
    columnId: number
  ): Promise<Column> {
    const response = await api.get<ApiResponse<Column>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`
    );

    return response.data;
  },

  async create(
    workspaceId: number,
    boardId: number,
    name: string
  ): Promise<Column> {
    const response = await api.post<ApiResponse<Column>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns`,
      { name }
    );

    return response.data;
  },

  async update(
    workspaceId: number,
    boardId: number,
    columnId: number,
    name: string
  ) {
    return api.patch<ApiResponse<any>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
      { name }
    );
  },

  async delete(
    workspaceId: number,
    boardId: number,
    columnId: number
  ) {
    return api.delete<ApiResponse<any>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`
    );
  },
};

export const taskApi = {
  async getAll(
    workspaceId: number,
    boardId: number,
    columnId: number
  ): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks`
    );

    return response.data;
  },

  async getOne(
    workspaceId: number,
    boardId: number,
    columnId: number,
    taskId: number
  ): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`
    );

    return response.data;
  },

  async create(
    workspaceId: number,
    boardId: number,
    columnId: number,
    data: {
      title: string;
      description?: string;
      priority?: "LOW" | "MEDIUM" | "HIGH";
    }
  ): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks`,
      data
    );

    return response.data;
  },

  async update(
    workspaceId: number,
    boardId: number,
    columnId: number,
    taskId: number,
    data: {
      title?: string;
      description?: string;
      priority?: "LOW" | "MEDIUM" | "HIGH";
      expectedRevision: number;
    }
  ) {
    const response = await api.patch<ApiResponse<Task>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`,
      data
    );

    return response.data;
  },

  async delete(
    workspaceId: number,
    boardId: number,
    columnId: number,
    taskId: number
  ) {
    return api.delete<ApiResponse<any>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`
    );
  },

  async move(
    workspaceId: number,
    boardId: number,
    sourceColumnId: number,
    taskId: number,
    targetColumnId: number,
    targetPosition: number,
    expectedRevision: number
  ) {
    const response = await api.patch<ApiResponse<Task>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${sourceColumnId}/tasks/${taskId}/move`,
      {
        targetColumnId,
        targetPosition,
        expectedRevision,
      }
    );

    return response.data;
  },

  async history(
    workspaceId: number,
    boardId: number,
    columnId: number,
    taskId: number
  ): Promise<TaskHistory[]> {
    const response = await api.get<ApiResponse<TaskHistory[]>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/history`
    );

    return response.data;
  },
};

export const commentApi = {
  async getAll(
    workspaceId: number,
    boardId: number,
    columnId: number,
    taskId: number
  ): Promise<Comment[]> {
    const response = await api.get<ApiResponse<Comment[]>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments`
    );

    return response.data;
  },

  async create(
    workspaceId: number,
    boardId: number,
    columnId: number,
    taskId: number,
    content: string
  ): Promise<Comment> {
    const response = await api.post<ApiResponse<Comment>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments`,
      { content }
    );

    return response.data;
  },

  async delete(
    workspaceId: number,
    boardId: number,
    columnId: number,
    taskId: number,
    commentId: number
  ) {
    return api.delete<ApiResponse<any>>(
      `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments/${commentId}`
    );
  },
};