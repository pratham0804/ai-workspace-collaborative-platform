import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import {
  hashPassword,
  comparePassword,
} from "../utils/password.js";
import { createSession } from "../utils/session.js";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function loginUser(
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await comparePassword(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const session = await createSession(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    session,
  };
}

export async function logoutUser(
  sessionToken: string
) {
  const tokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}