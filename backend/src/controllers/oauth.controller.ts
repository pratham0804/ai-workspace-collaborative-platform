import type { Request, Response } from "express";
import  jwt  from "jsonwebtoken";

import { exchangeAuthorizationCode } from "../services/oauth.services.js";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function token(
  req: Request,
  res: Response
) {
  try {
    const {
      grant_type,
      code,
      client_id,
      redirect_uri,
      code_verifier,
    } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({
        error: "unsupported_grant_type",
      });
    }

    if (
      !code ||
      !client_id ||
      !redirect_uri ||
      !code_verifier
    ) {
      return res.status(400).json({
        error: "invalid_request",
        message:
          "code, client_id, redirect_uri and code_verifier are required",
      });
    }

    const result =
      await exchangeAuthorizationCode(
        code,
        client_id,
        redirect_uri,
        code_verifier
      );

    const idToken = jwt.sign(
      {
        sub: String(result.user.id),
        name: result.user.name,
        email: result.user.email,
        client_id: client_id,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const accessToken = jwt.sign(
      {
        sub: String(result.user.id),
        client_id: client_id,
        scope: "read write",
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      token_type: "Bearer",
      expires_in: 3600,
      id_token: idToken,
      access_token: accessToken,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Token exchange failed";

    return res.status(400).json({
      error: "invalid_grant",
      message,
    });
  }
}