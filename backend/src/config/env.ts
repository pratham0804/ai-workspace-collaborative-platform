import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
