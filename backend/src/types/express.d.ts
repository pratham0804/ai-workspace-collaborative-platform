import type { WorkspaceMember } from "@prisma/client";
import type { AuthUser } from "./auth-user.js";

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
