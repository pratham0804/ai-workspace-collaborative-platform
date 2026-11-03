import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { startCollaborationServer } from "./collab/server.js";
import { initSocket } from "./socket/index.js";

const httpServer = createServer(app);

initSocket(httpServer);
startCollaborationServer();

httpServer.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
