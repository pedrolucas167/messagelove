/**
 * Hierarquia de erros da aplicação
 * Single Responsibility: cada erro representa um caso específico
 */

export enum ErrorCode {
  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Forbidden (403)
  FORBIDDEN = 'FORBIDDEN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Not Found (404)
  NOT_FOUND = 'NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  
  // Conflict (409)
  CONFLICT = 'CONFLICT',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  
  // Rate Limit (429)
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server Error (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export interface AppErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor({ code, message, statusCode, details }: AppErrorDetails) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// Factory functions para erros comuns (Open/Closed Principle)
export const Errors = {
  validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 400,
      details,
    });
  },

  invalidInput(field: string, reason?: string): AppError {
    return new AppError({
      code: ErrorCode.INVALID_INPUT,
      message: reason || `Campo '${field}' inválido`,
      statusCode: 400,
      details: { field },
    });
  },

  unauthorized(message = 'Não autorizado'): AppError {
    return new AppError({
      code: ErrorCode.UNAUTHORIZED,
      message,
      statusCode: 401,
    });
  },

  invalidCredentials(): AppError {
    return new AppError({
      code: ErrorCode.INVALID_CREDENTIALS,
      message: 'Credenciais inválidas',
      statusCode: 401,
    });
  },

  tokenExpired(): AppError {
    return new AppError({
      code: ErrorCode.TOKEN_EXPIRED,
      message: 'Token expirado',
      statusCode: 401,
    });
  },

  tokenInvalid(): AppError {
    return new AppError({
      code: ErrorCode.TOKEN_INVALID,
      message: 'Token inválido',
      statusCode: 401,
    });
  },

  forbidden(message = 'Acesso negado'): AppError {
    return new AppError({
      code: ErrorCode.FORBIDDEN,
      message,
      statusCode: 403,
    });
  },

  accountLocked(): AppError {
    return new AppError({
      code: ErrorCode.ACCOUNT_LOCKED,
      message: 'Conta bloqueada temporariamente por excesso de tentativas',
      statusCode: 403,
    });
  },

  notFound(resource: string): AppError {
    return new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `${resource} não encontrado(a)`,
      statusCode: 404,
    });
  },

  userNotFound(): AppError {
    return new AppError({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'Usuário não encontrado',
      statusCode: 404,
    });
  },

  cardNotFound(): AppError {
    return new AppError({
      code: ErrorCode.CARD_NOT_FOUND,
      message: 'Cartão não encontrado',
      statusCode: 404,
    });
  },

  emailAlreadyExists(): AppError {
    return new AppError({
      code: ErrorCode.EMAIL_ALREADY_EXISTS,
      message: 'Este email já está em uso',
      statusCode: 409,
    });
  },

  tooManyRequests(retryAfter?: number): AppError {
    return new AppError({
      code: ErrorCode.TOO_MANY_REQUESTS,
      message: 'Muitas tentativas. Por favor, tente novamente mais tarde.',
      statusCode: 429,
      details: retryAfter ? { retryAfter } : undefined,
    });
  },

  internal(message = 'Erro interno do servidor'): AppError {
    return new AppError({
      code: ErrorCode.INTERNAL_ERROR,
      message,
      statusCode: 500,
    });
  },

  database(message = 'Erro de banco de dados'): AppError {
    return new AppError({
      code: ErrorCode.DATABASE_ERROR,
      message,
      statusCode: 500,
    });
  },

  externalService(service: string, message?: string): AppError {
    return new AppError({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: message || `Erro ao comunicar com serviço externo: ${service}`,
      statusCode: 502,
      details: { service },
    });
  },
};
