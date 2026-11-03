import { api } from "./api";
import type {
  DocumentRecord,
  DocumentSummary,
  DocumentVersionRecord,
  DocumentVersionSummary,
  Workspace,
} from "../types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const workspaceApi = {
  async getAll() {
    const response = await api.get<ApiResponse<Workspace[]>>("/workspaces");
    return response.data;
  },
};

export const documentApi = {
  async list(workspaceId: number) {
    const response = await api.get<ApiResponse<DocumentSummary[]>>(
      `/workspaces/${workspaceId}/documents`
    );
    return response.data;
  },

  async search(workspaceId: number, query: string) {
    const response = await api.get<ApiResponse<DocumentSummary[]>>(
      `/workspaces/${workspaceId}/documents?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  async get(workspaceId: number, documentId: number) {
    const response = await api.get<ApiResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents/${documentId}`
    );
    return response.data;
  },

  async create(workspaceId: number, title: string, parentId?: number | null) {
    const response = await api.post<ApiResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents`,
      { title, parentId: parentId ?? null }
    );
    return response.data;
  },

  async update(
    workspaceId: number,
    documentId: number,
    data: {
      title?: string;
      parentId?: number | null;
      expectedRevision: number;
    }
  ) {
    const response = await api.patch<ApiResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents/${documentId}`,
      data
    );
    return response.data;
  },

  async checkpoint(
    workspaceId: number,
    documentId: number,
    changeSummary?: string
  ) {
    const response = await api.post<ApiResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents/${documentId}/checkpoint`,
      changeSummary ? { changeSummary } : {}
    );
    return response.data;
  },

  async remove(workspaceId: number, documentId: number) {
    return api.delete<ApiResponse<unknown>>(
      `/workspaces/${workspaceId}/documents/${documentId}`
    );
  },

  async versions(workspaceId: number, documentId: number) {
    const response = await api.get<ApiResponse<DocumentVersionSummary[]>>(
      `/workspaces/${workspaceId}/documents/${documentId}/versions`
    );
    return response.data;
  },

  async version(workspaceId: number, documentId: number, versionId: number) {
    const response = await api.get<ApiResponse<DocumentVersionRecord>>(
      `/workspaces/${workspaceId}/documents/${documentId}/versions/${versionId}`
    );
    return response.data;
  },

  async restore(workspaceId: number, documentId: number, versionId: number) {
    const response = await api.post<ApiResponse<DocumentRecord>>(
      `/workspaces/${workspaceId}/documents/${documentId}/versions/${versionId}/restore`
    );
    return response.data;
  },
};
