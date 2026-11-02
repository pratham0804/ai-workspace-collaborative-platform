import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { prisma } from "../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      success: false,
      message: "Access token is required",
    });
  }

  const [scheme, token] =
    authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });
  }

  try {
    // 1. Verify the JWT
    const payload = jwt.verify(
      token,
      JWT_SECRET
    );

    if (
      typeof payload === "string" ||
      !payload.sub
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    // 2. Get user ID from JWT
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID in access token",
      });
    }

    // 3. Find the actual user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // 4. Attach information to request
    req.auth = payload;
    req.user = user;

    // 5. Continue to controller
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}