import type { Request, Response } from "express";

import {
  registerUser,
  loginUser,
  logoutUser
} from "../services/auth.service.js";

export async function register(
  req: Request,
  res: Response
) {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser(
      name,
      email,
      password
    );

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const {
      email,
      password,
      return_to,
    } = req.body;

    const result = await loginUser(
      email,
      password
    );

    res.cookie("idp_session", result.session.sessionToken, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
  expires: result.session.expiresAt,
});

console.log(
  "LOGIN CREATED SESSION:",
  result.session.sessionToken
);



    if (
      typeof return_to === "string" &&
      return_to.startsWith("/oauth/authorize")
    ) {
      return res.redirect(return_to);
    }

    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}


export async function logout(
  req: Request,
  res: Response
) {
  try {
    const sessionToken = req.cookies?.idp_session;

    if (sessionToken) {
      await logoutUser(sessionToken);
    }

    res.clearCookie("idp_session");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
}


export function loginPage(req: Request, res: Response) {
  const returnTo =
    typeof req.query.return_to === "string"
      ? req.query.return_to
      : "/";

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Identity Provider Login</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            background: #f4f5f7;
            color: #172b4d;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          form {
            background: #fff;
            padding: 24px;
            border-radius: 8px;
            min-width: 280px;
            box-shadow: 0 1px 4px rgba(9, 30, 66, 0.16);
          }
          label { display: block; margin-bottom: 4px; }
          input {
            width: 100%;
            box-sizing: border-box;
            padding: 8px;
            margin-bottom: 12px;
          }
          button {
            width: 100%;
            padding: 8px 12px;
            background: #0052cc;
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <form method="POST" action="/api/identity/login">
          <h1>Login</h1>
          <input
            type="hidden"
            name="return_to"
            value="${returnTo}"
          />

          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              required
            />
          </div>

          <br />

          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
            />
          </div>

          <br />

          <button type="submit">
            Login
          </button>
        </form>
      </body>
    </html>
  `);
}