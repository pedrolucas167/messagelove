/**
 * Auth Service - Business Logic Layer
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: autenticação e gestão de usuários
 * - Open/Closed: extensível para novos providers (Google, etc)
 * - Liskov Substitution: repositories podem ser substituídos por mocks
 * - Dependency Inversion: depende de interfaces
 */

import crypto from 'crypto';
import { Result } from '../core/types/result';
import { Errors, AppError } from '../core/errors/app-error';
import { userRepository, type IUserRepository, type SafeUserEntity } from '../repositories/user.repository';
import { passwordResetTokenRepository, type IPasswordResetTokenRepository } from '../repositories/password-reset-token.repository';
import { hashService, type BcryptHashService } from './hash.service';
import { tokenService, type JwtTokenService } from './token.service';
import type { RegisterDTO, LoginDTO, GoogleLoginDTO, ResetPasswordDTO } from '../dtos/auth.dto';
import { logger } from '../config/logger';
import { env } from '../lib/env';

export interface AuthResult {
  token: string;
  user: SafeUserEntity;
}

export interface PasswordResetResult {
  token: string;
  resetUrl: string;
  email: string;
}

export interface AuthServiceDependencies {
  userRepo: IUserRepository;
  tokenRepo: IPasswordResetTokenRepository;
  hasher: BcryptHashService;
  tokens: JwtTokenService;
}

export class AuthService {
  private readonly userRepo: IUserRepository;
  private readonly tokenRepo: IPasswordResetTokenRepository;
  private readonly hasher: BcryptHashService;
  private readonly tokens: JwtTokenService;

  constructor(deps?: Partial<AuthServiceDependencies>) {
    this.userRepo = deps?.userRepo ?? userRepository;
    this.tokenRepo = deps?.tokenRepo ?? passwordResetTokenRepository;
    this.hasher = deps?.hasher ?? hashService;
    this.tokens = deps?.tokens ?? tokenService;
  }

  /**
   * Registra um novo usuário
   */
  async register(data: RegisterDTO): Promise<Result<AuthResult, AppError>> {
    try {
      // Verifica se email já existe
      const existing = await this.userRepo.findByEmail(data.email);
      
      if (existing) {
        return Result.fail(Errors.emailAlreadyExists());
      }

      // Hash da senha
      const hashedPassword = await this.hasher.hash(data.password);

      // Cria o usuário
      const user = await this.userRepo.create({
        ...data,
        password: hashedPassword,
      });

      // Gera token
      const token = this.tokens.generate({ userId: user.id });

      // Busca dados seguros (sem senha)
      const safeUser = await this.userRepo.findSafeById(user.id);
      
      if (!safeUser) {
        return Result.fail(Errors.internal('Erro ao criar usuário'));
      }

      logger.info('Usuário registrado com sucesso', { userId: user.id, email: data.email });
      
      return Result.ok({ token, user: safeUser });
    } catch (error) {
      logger.error('Erro no registro', { email: data.email, error });
      return Result.fail(Errors.database('Erro ao registrar usuário'));
    }
  }

  /**
   * Faz login com email e senha
   */
  async login(data: LoginDTO): Promise<Result<AuthResult, AppError>> {
    try {
      // Busca usuário com senha
      const user = await this.userRepo.findByEmailWithPassword(data.email);
      
      if (!user || !user.password) {
        return Result.fail(Errors.invalidCredentials());
      }

      // Verifica senha
      const isValid = await this.hasher.compare(data.password, user.password);
      
      if (!isValid) {
        return Result.fail(Errors.invalidCredentials());
      }

      // Gera token
      const token = this.tokens.generate({ userId: user.id });

      // Busca dados seguros
      const safeUser = await this.userRepo.findSafeById(user.id);
      
      if (!safeUser) {
        return Result.fail(Errors.internal('Erro no login'));
      }

      logger.info('Login realizado com sucesso', { userId: user.id, email: data.email });
      
      return Result.ok({ token, user: safeUser });
    } catch (error) {
      logger.error('Erro no login', { email: data.email, error });
      return Result.fail(Errors.database('Erro ao realizar login'));
    }
  }

  /**
   * Login via Google OAuth
   */
  async loginWithGoogle(data: GoogleLoginDTO): Promise<Result<AuthResult, AppError>> {
    try {
      // Tenta encontrar usuário por email
      let user = await this.userRepo.findByEmailWithPassword(data.email);

      if (user) {
        // Atualiza googleId se não existir
        if (!user.googleId) {
          await this.userRepo.updateGoogleId(user.id, data.googleId);
        }
      } else {
        // Cria novo usuário (sem senha, é OAuth)
        user = await this.userRepo.create({
          email: data.email,
          name: data.name,
          password: null,
          googleId: data.googleId,
        });
      }

      // Gera token
      const token = this.tokens.generate({ userId: user.id });

      // Busca dados seguros
      const safeUser = await this.userRepo.findSafeById(user.id);
      
      if (!safeUser) {
        return Result.fail(Errors.internal('Erro no login com Google'));
      }

      logger.info('Login Google realizado', { userId: user.id, email: data.email });
      
      return Result.ok({ token, user: safeUser });
    } catch (error) {
      logger.error('Erro no login Google', { email: data.email, error });
      return Result.fail(Errors.database('Erro ao realizar login com Google'));
    }
  }

  /**
   * Solicita reset de senha
   */
  async requestPasswordReset(email: string): Promise<Result<PasswordResetResult | null, AppError>> {
    try {
      const user = await this.userRepo.findByEmail(email);
      
      // Retorna null silenciosamente se usuário não existe
      // (security: não revelar se email existe)
      if (!user) {
        logger.info('Reset solicitado para email não cadastrado', { email });
        return Result.ok(null);
      }

      // Gera token aleatório
      const token = crypto.randomBytes(32).toString('hex');
      
      // Salva hash do token
      await this.tokenRepo.create(user.id, token, 15); // 15 minutos

      // Monta URL de reset
      const baseUrl = env.FRONTEND_URL?.replace(/\/$/, '') ?? '';
      const resetUrl = `${baseUrl}/reset?token=${token}&email=${encodeURIComponent(email)}`;

      logger.info('Link de reset gerado', { email, userId: user.id });
      
      return Result.ok({ token, resetUrl, email });
    } catch (error) {
      logger.error('Erro ao solicitar reset', { email, error });
      return Result.fail(Errors.database('Erro ao solicitar reset de senha'));
    }
  }

  /**
   * Reseta a senha com token
   */
  async resetPassword(data: ResetPasswordDTO): Promise<Result<void, AppError>> {
    try {
      // Busca usuário
      const user = await this.userRepo.findByEmailWithPassword(data.email);
      
      if (!user) {
        return Result.fail(Errors.tokenInvalid());
      }

      // Valida token
      const tokenRecord = await this.tokenRepo.findValidToken(user.id, data.token);
      
      if (!tokenRecord) {
        return Result.fail(Errors.tokenInvalid());
      }

      // Hash da nova senha
      const hashedPassword = await this.hasher.hash(data.newPassword);

      // Atualiza senha e marca token como usado (paralelo)
      await Promise.all([
        this.userRepo.updatePassword(user.id, hashedPassword),
        this.tokenRepo.markAsUsed(tokenRecord.id),
      ]);

      logger.info('Senha redefinida com sucesso', { email: data.email, userId: user.id });
      
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Erro ao redefinir senha', { email: data.email, error });
      return Result.fail(Errors.database('Erro ao redefinir senha'));
    }
  }

  /**
   * Verifica e decodifica um token
   */
  verifyToken(token: string): Result<{ userId: string }, AppError> {
    return this.tokens.verify(token);
  }

  /**
   * Gera um novo token (refresh)
   */
  generateToken(userId: string): string {
    return this.tokens.generate({ userId });
  }

  /**
   * Busca usuário por ID (dados seguros)
   */
  async findUserById(userId: string): Promise<Result<SafeUserEntity, AppError>> {
    try {
      const user = await this.userRepo.findSafeById(userId);
      
      if (!user) {
        return Result.fail(Errors.userNotFound());
      }

      return Result.ok(user);
    } catch (error) {
      logger.error('Erro ao buscar usuário', { userId, error });
      return Result.fail(Errors.database('Erro ao buscar usuário'));
    }
  }
}

// Singleton
export const authService = new AuthService();
