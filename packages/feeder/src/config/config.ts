import dotenv from "dotenv";

dotenv.config();

export const config = {
  app: {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  database: {
    url: process.env.DATABASE_URL || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "fallback-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
} as const;

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET"];

if (config.app.nodeEnv === "production") {
  requiredEnvVars.push("DATABASE_URL");
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
