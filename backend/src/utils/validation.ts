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