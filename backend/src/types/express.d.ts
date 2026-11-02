import { User, type WorkspaceMember } from "@prisma/client";


declare global {
  namespace Express {
    interface Request {
      user?: User;
      auth?: string | object;
      workspaceMembership? : WorkspaceMember;
      
    }
  }
}

export {};