import crypto from "crypto";
import { prisma } from "../config/prisma.js";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export async function createSession(userId: number) {
  const sessionToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return {
    sessionToken,
    expiresAt,
  };
}