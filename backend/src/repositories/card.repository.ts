/**
 * Card Repository - Data Access Layer
 * Single Responsibility: apenas operações de dados do Card
 */

import { Op, type WhereOptions } from 'sequelize';
import { Card, initCardModel } from '../db/models/card';
import { ensureDatabaseConnection } from '../db';
import type { IRepository, QueryOptions, PaginatedResult } from '../core/interfaces/repository';
import type { CreateCardDTO, UpdateCardDTO } from '../dtos/card.dto';

export interface CardEntity {
  id: string;
  userId: string;
  de: string;
  para: string;
  mensagem: string;
  fotoUrl: string | null;
  youtubeVideoId: string | null;
  youtubeStartTime: number | null;
  youtubeEndTime: number | null;
  youtubeAutoplay: boolean | null;
  spotifyUri: string | null;
  musicType: 'youtube' | 'spotify' | null;
  audioUrl: string | null;
  audioDuration: number | null;
  relationshipDate: Date | null;
  selectedAnimal: string | null;
  selectedGif: string | null;
  selectedEmoji: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardFilters {
  userId?: string;
  search?: string;
}

export type CardUpdateData = UpdateCardDTO & { fotoUrl?: string | null; audioUrl?: string | null };

export interface ICardRepository extends IRepository<CardEntity, CreateCardDTO & { userId: string }, CardUpdateData> {
  findByUserId(userId: string, options?: QueryOptions): Promise<CardEntity[]>;
  findByIdAndUserId(id: string, userId: string): Promise<CardEntity | null>;
  countByUserId(userId: string): Promise<number>;
}

export class CardRepository implements ICardRepository {
  private async getModel(): Promise<typeof Card> {
    await ensureDatabaseConnection();
    return initCardModel();
  }

  async findById(id: string): Promise<CardEntity | null> {
    const CardModel = await this.getModel();
    const card = await CardModel.findByPk(id);
    return card ? this.toEntity(card) : null;
  }

  async findAll(options?: QueryOptions): Promise<CardEntity[]> {
    const CardModel = await this.getModel();
    const cards = await CardModel.findAll({
      order: [[options?.orderBy ?? 'createdAt', options?.orderDirection ?? 'DESC']],
      limit: options?.limit,
      offset: options?.offset,
    });
    return cards.map((c) => this.toEntity(c));
  }

  async exists(id: string): Promise<boolean> {
    const CardModel = await this.getModel();
    const count = await CardModel.count({ where: { id } });
    return count > 0;
  }

  async findByUserId(userId: string, options?: QueryOptions): Promise<CardEntity[]> {
    const CardModel = await this.getModel();
    const cards = await CardModel.findAll({
      where: { userId },
      order: [[options?.orderBy ?? 'createdAt', options?.orderDirection ?? 'DESC']],
      limit: options?.limit,
      offset: options?.offset,
    });
    return cards.map((c) => this.toEntity(c));
  }

  async findByIdAndUserId(id: string, userId: string): Promise<CardEntity | null> {
    const CardModel = await this.getModel();
    const card = await CardModel.findOne({ where: { id, userId } });
    return card ? this.toEntity(card) : null;
  }

  async countByUserId(userId: string): Promise<number> {
    const CardModel = await this.getModel();
    return CardModel.count({ where: { userId } });
  }

  async create(data: CreateCardDTO & { userId: string }): Promise<CardEntity> {
    const CardModel = await this.getModel();
    const card = await CardModel.create({
      userId: data.userId,
      de: data.de,
      para: data.para,
      mensagem: data.mensagem,
      youtubeVideoId: data.youtubeVideoId ?? null,
      youtubeStartTime: data.youtubeStartTime ?? null,
      youtubeEndTime: data.youtubeEndTime ?? null,
      youtubeAutoplay: data.youtubeAutoplay ?? false,
      spotifyUri: data.spotifyUri ?? null,
      musicType: data.musicType ?? null,
      audioDuration: data.audioDuration ?? null,
      relationshipDate: data.relationshipDate ?? null,
      selectedAnimal: data.selectedAnimal ?? null,
      selectedGif: data.selectedGif ?? null,
      selectedEmoji: data.selectedEmoji ?? null,
    });
    return this.toEntity(card);
  }

  async update(id: string, data: CardUpdateData): Promise<CardEntity | null> {
    const CardModel = await this.getModel();
    const card = await CardModel.findByPk(id);
    
    if (!card) return null;

    // Filtra apenas campos definidos
    const updateData: Record<string, unknown> = {};
    if (data.de !== undefined) updateData.de = data.de;
    if (data.para !== undefined) updateData.para = data.para;
    if (data.mensagem !== undefined) updateData.mensagem = data.mensagem;
    if (data.youtubeVideoId !== undefined) updateData.youtubeVideoId = data.youtubeVideoId;
    if (data.youtubeStartTime !== undefined) updateData.youtubeStartTime = data.youtubeStartTime;
    if (data.youtubeEndTime !== undefined) updateData.youtubeEndTime = data.youtubeEndTime;
    if (data.youtubeAutoplay !== undefined) updateData.youtubeAutoplay = data.youtubeAutoplay;
    if (data.spotifyUri !== undefined) updateData.spotifyUri = data.spotifyUri;
    if (data.musicType !== undefined) updateData.musicType = data.musicType;
    if (data.audioDuration !== undefined) updateData.audioDuration = data.audioDuration;
    if (data.relationshipDate !== undefined) updateData.relationshipDate = data.relationshipDate;
    if (data.selectedAnimal !== undefined) updateData.selectedAnimal = data.selectedAnimal;
    if (data.selectedGif !== undefined) updateData.selectedGif = data.selectedGif;
    if (data.selectedEmoji !== undefined) updateData.selectedEmoji = data.selectedEmoji;
    if ('fotoUrl' in data) updateData.fotoUrl = data.fotoUrl;
    if ('audioUrl' in data) updateData.audioUrl = data.audioUrl;

    await card.update(updateData);
    return this.toEntity(card);
  }

  async delete(id: string): Promise<boolean> {
    const CardModel = await this.getModel();
    const deleted = await CardModel.destroy({ where: { id } });
    return deleted > 0;
  }

  async findWithFilters(
    filters: CardFilters,
    options?: QueryOptions
  ): Promise<PaginatedResult<CardEntity>> {
    const CardModel = await this.getModel();
    const where: WhereOptions = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.search) {
      where[Op.or as unknown as string] = [
        { de: { [Op.iLike]: `%${filters.search}%` } },
        { para: { [Op.iLike]: `%${filters.search}%` } },
        { mensagem: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    const page = Math.floor((options?.offset ?? 0) / (options?.limit ?? 10)) + 1;
    const pageSize = options?.limit ?? 10;

    const { count, rows } = await CardModel.findAndCountAll({
      where,
      order: [[options?.orderBy ?? 'createdAt', options?.orderDirection ?? 'DESC']],
      limit: pageSize,
      offset: options?.offset ?? 0,
    });

    return {
      data: rows.map((c) => this.toEntity(c)),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  private toEntity(card: Card): CardEntity {
    return {
      id: card.id,
      userId: card.userId,
      de: card.de,
      para: card.para,
      mensagem: card.mensagem,
      fotoUrl: card.fotoUrl,
      youtubeVideoId: card.youtubeVideoId,
      youtubeStartTime: card.youtubeStartTime,
      youtubeEndTime: card.youtubeEndTime ?? null,
      youtubeAutoplay: card.youtubeAutoplay ?? null,
      spotifyUri: card.spotifyUri ?? null,
      musicType: card.musicType ?? null,
      audioUrl: card.audioUrl,
      audioDuration: card.audioDuration,
      relationshipDate: card.relationshipDate ?? null,
      selectedAnimal: card.selectedAnimal ?? null,
      selectedGif: card.selectedGif ?? null,
      selectedEmoji: card.selectedEmoji ?? null,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}

// Singleton para uso global
export const cardRepository = new CardRepository();
