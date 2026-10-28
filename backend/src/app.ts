import express from "express";
import healthRouter from "./routes/health.routes"
import dbRouter from "./routes/db.routes"


const app = express();
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", dbRouter);

export default app;