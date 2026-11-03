import { Router } from "express";
import crypto from "crypto";

import { prisma } from "../config/prisma.js";
import { token } from "../controllers/oauth.controller.js";

const router = Router();

router.post("/token", token);

router.get("/authorize", async (req, res) => {
  try {
    const {
      client_id,
      redirect_uri,
      response_type,
      code_challenge,
      code_challenge_method,
      state,
    } = req.query;

    if (
      typeof client_id !== "string" ||
      typeof redirect_uri !== "string" ||
      typeof response_type !== "string" ||
      typeof code_challenge !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid authorization request",
      });
    }

    if (response_type !== "code") {
      return res.status(400).json({
        success: false,
        message: "Only response_type=code is supported",
      });
    }

    if (
      typeof code_challenge_method !== "string" ||
      code_challenge_method !== "S256"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only S256 PKCE is supported",
      });
    }

    const client = await prisma.oAuthClient.findUnique({
      where: { clientId: client_id },
    });

    if (!client) {
      return res.status(400).json({
        success: false,
        message: "Unknown client",
      });
    }

    if (!client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({
        success: false,
        message: "Invalid redirect URI",
      });
    }

    if (!req.user) {
  const currentUrl = new URL(
    req.originalUrl,
    `${req.protocol}://${req.get("host")}`
  );

  const loginUrl = new URL(
    "/api/identity/login",
    `${req.protocol}://${req.get("host")}`
  );

  loginUrl.searchParams.set(
    "return_to",
    currentUrl.pathname + currentUrl.search
  );

  return res.redirect(loginUrl.toString());
}

    const rawCode = crypto.randomBytes(32).toString("hex");

    const codeHash = crypto
      .createHash("sha256")
      .update(rawCode)
      .digest("hex");

    await prisma.authorizationCode.create({
      data: {
        codeHash,
        oauthClientId: client.id,
        userId: req.user.id,
        redirectUri: redirect_uri,
        codeChallenge : code_challenge ,
        codeChallengeMethod: code_challenge_method,
        expiresAt: new Date(
          Date.now() + 60 * 1000
        ),
      },
    });

    const redirectUrl = new URL(redirect_uri);

    redirectUrl.searchParams.set(
      "code",
      rawCode
    );

    if (typeof state === "string" && state.length > 0) {
      redirectUrl.searchParams.set("state", state);
    }

    return res.redirect(
      redirectUrl.toString()
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
});

export default router;