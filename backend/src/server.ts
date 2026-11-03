import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { initSocket } from "./socket/index.js";

const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
