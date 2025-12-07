/**
 * Error Handler Middleware - Centralizado
 * Trata AppError e erros não-tratados de forma consistente
 */

import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, Errors, ErrorCode } from '../core/errors/app-error';
import { logger } from '../config/logger';

/**
 * Log de erros com contexto
 */
export function logErrors(
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const requestId = (req as { id?: string }).id || 'unknown';
  
  if (err instanceof AppError && err.isOperational) {
    // Erros operacionais - log como warning
    logger.warn(`[${requestId}] ${req.method} ${req.originalUrl} - ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    });
  } else {
    // Erros não-operacionais - log como error com stack
    logger.error(`[${requestId}] ${req.method} ${req.originalUrl} - ${err.message}`, {
      stack: err.stack,
      name: err.name,
    });
  }
  
  next(err);
}

/**
 * Transforma ZodError em AppError
 */
function handleZodError(err: ZodError): AppError {
  const issues = err.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  return new AppError({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Erro de validação',
    statusCode: 400,
    details: { issues },
  });
}

/**
 * Handler global de erros
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Já respondeu
  if (res.headersSent) {
    return;
  }

  // ZodError -> AppError
  if (err instanceof ZodError) {
    const appError = handleZodError(err);
    res.status(appError.statusCode).json(appError.toJSON());
    return;
  }

  // AppError - erro tratado
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Erros de parsing JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.INVALID_INPUT,
        message: 'JSON inválido no corpo da requisição',
      },
    });
    return;
  }

  // Erro não tratado - 500
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: isProduction
        ? 'Ocorreu um erro interno inesperado'
        : err.message,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}

/**
 * Wrapper para async handlers - evita try/catch repetitivo
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not Found handler - 404
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = Errors.notFound('Recurso');
  res.status(404).json(error.toJSON());
}
