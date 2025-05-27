import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error
  logger.error(`Error ${statusCode}: ${message}`, {
    error: err,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
  });

  // Don't leak error details in production
  const response = {
    success: false,
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
