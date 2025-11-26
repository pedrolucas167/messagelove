import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export function logErrors(err: Error, req: Request, _res: Response, next: NextFunction) {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
    status: (err as { status?: number }).status,
  });
  next(err);
}

export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = (err as { status?: number }).status ?? 500;
  const isProduction = process.env.NODE_ENV === "production";
  res.status(statusCode).json({
    message: isProduction && statusCode === 500 ? "Ocorreu um erro interno inesperado no servidor." : err.message,
    ...(isProduction
      ? {}
      : {
          error: err.name,
          stack: err.stack,
        }),
  });
}
