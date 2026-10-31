import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export async function sessionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {


  console.log("SESSION MIDDLEWARE HIT:", req.method, req.originalUrl);
  try {
    console.log("SESSION COOKIE:", req.cookies?.idp_session);
    const sessionToken = req.cookies?.idp_session;
    if (!sessionToken) {
      return next();
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const session = await prisma.session.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      return next();
    }

    req.user = session.user;

    next();
  } catch (error) {
    next(error);
  }
}