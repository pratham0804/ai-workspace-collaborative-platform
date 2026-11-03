import "dotenv/config";

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

export const env = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  hocuspocusPort: Number(process.env.HOCUSPOCUS_PORT) || 5001,
  frontendOrigins: (process.env.FRONTEND_ORIGINS || defaultOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
