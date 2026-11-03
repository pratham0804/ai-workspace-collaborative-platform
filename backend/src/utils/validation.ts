import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must contain at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must contain at least 8 characters"),
});


export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Workspace name must contain at least 2 characters")
    .max(100, "Workspace name cannot exceed 100 characters"),
});


export const createBoardSchema = z.object({
  name: z
    .string()
    .min(2, "Board name must contain at least 2 characters")
    .max(100, "Board name cannot exceed 100 characters"),
});

export const updateBoardSchema = z.object({
  name: z
    .string()
    .min(2, "Board name must contain at least 2 characters")
    .max(100, "Board name cannot exceed 100 characters"),
});


export const createColumnSchema = z.object({
  name: z
    .string()
    .min(2, "Column name must contain at least 2 characters")
    .max(100, "Column name cannot exceed 100 characters"),
});

export const updateColumnSchema = z.object({
  name: z
    .string()
    .min(2, "Column name must contain at least 2 characters")
    .max(100, "Column name cannot exceed 100 characters"),
});


export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title cannot exceed 200 characters"),

  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title cannot exceed 200 characters")
    .optional(),

  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .optional(),
});


export const moveTaskSchema = z.object({
  targetColumnId: z.number().int().positive("Invalid target column ID"),
  targetPosition: z.number().int().min(0, "Position cannot be negative"),
});

export const createCommentSchema = z.object({
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export const addWorkspaceMemberSchema = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const updateWorkspaceMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Document title is required")
    .max(200, "Document title cannot exceed 200 characters"),
  parentId: z.number().int().positive().nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Document title is required")
    .max(200, "Document title cannot exceed 200 characters")
    .optional(),
  parentId: z.number().int().positive().nullable().optional(),
  content: z.unknown().optional(),
  changeSummary: z
    .string()
    .max(300, "Change summary cannot exceed 300 characters")
    .optional(),
});