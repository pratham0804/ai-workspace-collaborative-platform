import type { User, WorkspaceMember } from "@prisma/client";

export type AuthUser = Omit<User, "passwordHash">;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      auth?: string | object;
      workspaceMembership?: WorkspaceMember;
    }
  }
}

export {};