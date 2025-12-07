/**
 * Token Service - JWT Implementation
 * Single Responsibility: geração e validação de tokens
 */

import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../lib/env';
import { Result } from '../core/types/result';
import { Errors, AppError } from '../core/errors/app-error';
import type { ITokenService, TokenPayload } from '../core/interfaces/service';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: SignOptions['expiresIn'];

  constructor() {
    this.secret = env.JWT_SECRET;
    this.expiresIn = (env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  }

  generate(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): Result<TokenPayload, AppError> {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return Result.ok(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return Result.fail(Errors.tokenExpired());
      }
      return Result.fail(Errors.tokenInvalid());
    }
  }

  decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload | null;
    } catch {
      return null;
    }
  }
}

export const tokenService = new JwtTokenService();
