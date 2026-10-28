import { Router } from "express";
import { prisma } from "../config/prisma";

const router = Router();

router.get("/db-test", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;

  res.status(200).json({
    success: true,
    message: "Database connection is working",
  });
});

export default router;