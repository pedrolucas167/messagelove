/**
 * Auth Middleware Refatorado
 * Usa Result pattern para tratamento de erros
 */

import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service.new';
import { Result } from '../core/types/result';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware de autenticação
 * Valida JWT e injeta userId no request
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token de autenticação não fornecido',
      },
    });
    return;
  }

  const token = authHeader.slice(7);
  const result = authService.verifyToken(token);

  if (!result.success) {
    res.status(401).json(result.error.toJSON());
    return;
  }

  req.userId = result.data.userId;
  next();
}

/**
 * Middleware opcional de autenticação
 * Não falha se não houver token
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const result = authService.verifyToken(token);

    if (result.success) {
      req.userId = result.data.userId;
    }
  }

  next();
}
