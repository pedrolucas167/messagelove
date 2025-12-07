/**
 * Password Reset Token Repository
 */

import crypto from 'crypto';
import { PasswordResetToken, initPasswordResetTokenModel } from '../db/models/password-reset-token';
import { ensureDatabaseConnection } from '../db';

export interface PasswordResetTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface IPasswordResetTokenRepository {
  create(userId: string, token: string, expiresInMinutes?: number): Promise<PasswordResetTokenEntity>;
  findValidToken(userId: string, token: string): Promise<PasswordResetTokenEntity | null>;
  markAsUsed(id: string): Promise<boolean>;
  deleteExpired(): Promise<number>;
}

export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private async getModel(): Promise<typeof PasswordResetToken> {
    await ensureDatabaseConnection();
    return initPasswordResetTokenModel();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, token: string, expiresInMinutes = 15): Promise<PasswordResetTokenEntity> {
    const TokenModel = await this.getModel();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const record = await TokenModel.create({
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
    });

    return this.toEntity(record);
  }

  async findValidToken(userId: string, token: string): Promise<PasswordResetTokenEntity | null> {
    const TokenModel = await this.getModel();
    const tokenHash = this.hashToken(token);

    const record = await TokenModel.findOne({
      where: { userId, tokenHash },
      order: [['createdAt', 'DESC']],
    });

    if (!record) return null;
    if (record.usedAt) return null;
    if (record.expiresAt < new Date()) return null;

    return this.toEntity(record);
  }

  async markAsUsed(id: string): Promise<boolean> {
    const TokenModel = await this.getModel();
    const [affected] = await TokenModel.update(
      { usedAt: new Date() },
      { where: { id } }
    );
    return affected > 0;
  }

  async deleteExpired(): Promise<number> {
    const TokenModel = await this.getModel();
    const { Op } = await import('sequelize');
    
    return TokenModel.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });
  }

  private toEntity(record: PasswordResetToken): PasswordResetTokenEntity {
    return {
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt ?? null,
      createdAt: record.createdAt,
    };
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
