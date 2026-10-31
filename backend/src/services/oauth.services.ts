import crypto from "crypto";
import { prisma } from "../config/prisma.js";

function hashValue(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function verifyPkce(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  const calculatedChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return calculatedChallenge === codeChallenge;
}

export async function exchangeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string
) {
  const codeHash = hashValue(code);

  const authorizationCode =
    await prisma.authorizationCode.findUnique({
      where: { codeHash },
      include: {
        user: true,
        oauthClient: true,
      },
    });

  if (!authorizationCode) {
    throw new Error("Invalid authorization code");
  }

  if (authorizationCode.used) {
    throw new Error("Authorization code has already been used");
  }

  if (authorizationCode.expiresAt <= new Date()) {
    throw new Error("Authorization code has expired");
  }

  if (authorizationCode.oauthClient.clientId !== clientId) {
    throw new Error("Invalid client");
  }

  if (authorizationCode.redirectUri !== redirectUri) {
    throw new Error("Invalid redirect URI");
  }

  if (
    authorizationCode.codeChallengeMethod !== "S256"
  ) {
    throw new Error("Unsupported PKCE method");
  }

  const pkceValid = verifyPkce(
    codeVerifier,
    authorizationCode.codeChallenge
  );

  if (!pkceValid) {
    throw new Error("Invalid PKCE verifier");
  }

  await prisma.authorizationCode.update({
    where: {
      id: authorizationCode.id,
    },
    data: {
      used: true,
    },
  });

  return {
    user: authorizationCode.user,
    client: authorizationCode.oauthClient,
  };
}