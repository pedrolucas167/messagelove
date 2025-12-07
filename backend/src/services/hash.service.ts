/**
 * Hash Service - BCrypt Implementation
 * Single Responsibility: hashing de senhas
 */

import bcrypt from 'bcryptjs';
import type { IHashService } from '../core/interfaces/service';

export class BcryptHashService implements IHashService {
  private readonly saltRounds: number;

  constructor(saltRounds = 12) {
    this.saltRounds = saltRounds;
  }

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltRounds);
  }

  async compare(value: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(value, hashed);
  }
}

export const hashService = new BcryptHashService();
