/**
 * User Repository - Data Access Layer
 */

import { User, initUserModel } from '../db/models/user';
import { ensureDatabaseConnection } from '../db';
import type { IRepository } from '../core/interfaces/repository';
import type { RegisterDTO } from '../dtos/auth.dto';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password: string | null;
  googleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUserEntity {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  name: string;
  password?: string | null;
  googleId?: string | null;
}

export interface IUserRepository extends IRepository<UserEntity, CreateUserData> {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByEmailWithPassword(email: string): Promise<UserEntity | null>;
  findByGoogleId(googleId: string): Promise<UserEntity | null>;
  updatePassword(id: string, hashedPassword: string): Promise<boolean>;
  updateGoogleId(id: string, googleId: string): Promise<boolean>;
  findSafeById(id: string): Promise<SafeUserEntity | null>;
}

export class UserRepository implements IUserRepository {
  private async getModel(): Promise<typeof User> {
    await ensureDatabaseConnection();
    return initUserModel();
  }

  async findById(id: string): Promise<UserEntity | null> {
    const UserModel = await this.getModel();
    const user = await UserModel.unscoped().findByPk(id);
    return user ? this.toEntity(user) : null;
  }

  async findSafeById(id: string): Promise<SafeUserEntity | null> {
    const UserModel = await this.getModel();
    const user = await UserModel.findByPk(id);
    return user ? this.toSafeEntity(user) : null;
  }

  async findAll(): Promise<UserEntity[]> {
    const UserModel = await this.getModel();
    const users = await UserModel.unscoped().findAll();
    return users.map((u) => this.toEntity(u));
  }

  async exists(id: string): Promise<boolean> {
    const UserModel = await this.getModel();
    const count = await UserModel.count({ where: { id } });
    return count > 0;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const UserModel = await this.getModel();
    const user = await UserModel.findOne({
      where: { email },
      attributes: ['id', 'email', 'name', 'googleId', 'createdAt', 'updatedAt'],
    });
    return user ? { ...this.toEntity(user), password: null } : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    const UserModel = await this.getModel();
    const user = await UserModel.unscoped().findOne({
      where: { email },
      attributes: ['id', 'email', 'name', 'password', 'googleId', 'createdAt', 'updatedAt'],
    });
    return user ? this.toEntity(user) : null;
  }

  async findByGoogleId(googleId: string): Promise<UserEntity | null> {
    const UserModel = await this.getModel();
    const user = await UserModel.findOne({ where: { googleId } });
    return user ? this.toEntity(user) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const UserModel = await this.getModel();
    const user = await UserModel.create({
      email: data.email,
      name: data.name,
      password: data.password ?? null,
      googleId: data.googleId ?? null,
    });
    return this.toEntity(user);
  }

  async update(id: string, data: Partial<RegisterDTO>): Promise<UserEntity | null> {
    const UserModel = await this.getModel();
    const user = await UserModel.unscoped().findByPk(id);

    if (!user) return null;

    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;

    await user.save();
    return this.toEntity(user);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
    const UserModel = await this.getModel();
    const [affected] = await UserModel.update(
      { password: hashedPassword },
      { where: { id } }
    );
    return affected > 0;
  }

  async updateGoogleId(id: string, googleId: string): Promise<boolean> {
    const UserModel = await this.getModel();
    const [affected] = await UserModel.update(
      { googleId },
      { where: { id } }
    );
    return affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const UserModel = await this.getModel();
    const deleted = await UserModel.destroy({ where: { id } });
    return deleted > 0;
  }

  private toEntity(user: User): UserEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.password ?? null,
      googleId: user.googleId ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toSafeEntity(user: User): SafeUserEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userRepository = new UserRepository();
