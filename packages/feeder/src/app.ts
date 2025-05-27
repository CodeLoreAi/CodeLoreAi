import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { config } from "./config/config";
import { errorHandler } from "./middleware/errorHandler";

import apiRoutes from "./routes/api";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.cors.allowedOrigins,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(config.app.nodeEnv === "production" ? "combined" : "dev"));

// Routes
app.use("/train", apiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
