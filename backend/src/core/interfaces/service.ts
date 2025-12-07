/**
 * Service Interfaces - Dependency Inversion Principle
 * Services dependem de abstrações, não de implementações concretas
 */

import type { Result } from '../types/result';
import type { AppError } from '../errors/app-error';

// Interface para serviço de storage (S3, local, etc)
export interface IStorageService {
  uploadImage(file: UploadableFile): Promise<Result<string, AppError>>;
  uploadAudio(file: UploadableFile): Promise<Result<string, AppError>>;
  deleteFile(url: string): Promise<Result<void, AppError>>;
}

export interface UploadableFile {
  buffer: Buffer;
  mimetype: string;
  originalName?: string;
}

// Interface para serviço de hash
export interface IHashService {
  hash(value: string): Promise<string>;
  compare(value: string, hashed: string): Promise<boolean>;
}

// Interface para serviço de token
export interface ITokenService {
  generate(payload: TokenPayload): string;
  verify(token: string): Result<TokenPayload, AppError>;
}

export interface TokenPayload {
  userId: string;
  [key: string]: unknown;
}

// Interface para serviço de email (futuro)
export interface IEmailService {
  send(options: EmailOptions): Promise<Result<void, AppError>>;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Interface para logger
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
