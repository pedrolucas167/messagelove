/**
 * Validation Middleware - Zod based
 * Substitui express-validator por Zod (mais type-safe)
 */

import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { AppError, ErrorCode } from '../core/errors/app-error';

export interface ValidatedRequest<TBody = unknown, TParams = unknown, TQuery = unknown>
  extends Request {
  validatedBody: TBody;
  validatedParams: TParams;
  validatedQuery: TQuery;
}

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Middleware de validação usando Zod
 * Valida body, params e query de forma type-safe
 */
export function validate(schemas: ValidationSchemas) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors: { location: string; issues: unknown[] }[] = [];

      // Valida body
      if (schemas.body) {
        const result = await schemas.body.safeParseAsync(req.body);
        if (result.success) {
          (req as ValidatedRequest).validatedBody = result.data;
        } else {
          errors.push({
            location: 'body',
            issues: result.error.issues,
          });
        }
      }

      // Valida params
      if (schemas.params) {
        const result = await schemas.params.safeParseAsync(req.params);
        if (result.success) {
          (req as ValidatedRequest).validatedParams = result.data;
        } else {
          errors.push({
            location: 'params',
            issues: result.error.issues,
          });
        }
      }

      // Valida query
      if (schemas.query) {
        const result = await schemas.query.safeParseAsync(req.query);
        if (result.success) {
          (req as ValidatedRequest).validatedQuery = result.data;
        } else {
          errors.push({
            location: 'query',
            issues: result.error.issues,
          });
        }
      }

      if (errors.length > 0) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Erro de validação',
          statusCode: 400,
          details: { errors },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Extrai dados validados do request
 */
export function getValidatedData<TBody = unknown, TParams = unknown, TQuery = unknown>(
  req: Request
): { body: TBody; params: TParams; query: TQuery } {
  const validated = req as ValidatedRequest<TBody, TParams, TQuery>;
  return {
    body: validated.validatedBody,
    params: validated.validatedParams,
    query: validated.validatedQuery,
  };
}
