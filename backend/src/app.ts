import express from "express";
import healthRouter from "./routes/health.routes.js"
import dbRouter from "./routes/db.routes.js"
import errorMiddleware from "./middleware/error.middleware.js"
import { loggerMiddleware } from "./middleware/logger.middleware.js";
import identityRouter from "./routes/identity.routes.js";
import cookieParser from "cookie-parser";
import oauthRouter from "./routes/oauth.routes.js"
import protectedRouter from "./routes/protected.routes.js"
import { sessionMiddleware } from "./middleware/session.middleware.js";
import workspaceRouter from "./routes/workspace.routes.js"
import cors from "cors";


const app = express();
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(loggerMiddleware);
app.use(sessionMiddleware);

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use("/api", healthRouter);
app.use("/api", dbRouter);
app.use("/api", protectedRouter);
app.use("/api/workspace", workspaceRouter);

app.use("/api/identity",identityRouter);
app.use("/oauth", oauthRouter);
app.use(errorMiddleware);

export default app;