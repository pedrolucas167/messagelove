/**
 * Card Service - Business Logic Layer
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: apenas lógica de negócio de cards
 * - Open/Closed: extensível via interfaces
 * - Dependency Inversion: depende de abstrações (repositories, storage)
 */

import { Result } from '../core/types/result';
import { Errors, AppError } from '../core/errors/app-error';
import { cardRepository, type CardEntity, type ICardRepository } from '../repositories/card.repository';
import { storageService, type S3StorageService } from './storage.service';
import type { CreateCardDTO, UpdateCardDTO } from '../dtos/card.dto';
import type { UploadableFile } from '../core/interfaces/service';
import type { QueryOptions } from '../core/interfaces/repository';
import { logger } from '../config/logger';

export interface CardServiceDependencies {
  cardRepo: ICardRepository;
  storage: S3StorageService;
}

export class CardService {
  private readonly cardRepo: ICardRepository;
  private readonly storage: S3StorageService;

  constructor(deps?: Partial<CardServiceDependencies>) {
    this.cardRepo = deps?.cardRepo ?? cardRepository;
    this.storage = deps?.storage ?? storageService;
  }

  /**
   * Lista todos os cards de um usuário
   */
  async listByUser(
    userId: string,
    options?: QueryOptions
  ): Promise<Result<CardEntity[], AppError>> {
    try {
      const cards = await this.cardRepo.findByUserId(userId, options);
      return Result.ok(cards);
    } catch (error) {
      logger.error('Erro ao listar cards', { userId, error });
      return Result.fail(Errors.database('Erro ao buscar cards'));
    }
  }

  /**
   * Busca um card por ID (público - não exige userId)
   */
  async findById(id: string): Promise<Result<CardEntity, AppError>> {
    try {
      const card = await this.cardRepo.findById(id);
      
      if (!card) {
        return Result.fail(Errors.cardNotFound());
      }

      return Result.ok(card);
    } catch (error) {
      logger.error('Erro ao buscar card', { id, error });
      return Result.fail(Errors.database('Erro ao buscar card'));
    }
  }

  /**
   * Busca um card do usuário (verificando ownership)
   */
  async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<Result<CardEntity, AppError>> {
    try {
      const card = await this.cardRepo.findByIdAndUserId(id, userId);
      
      if (!card) {
        return Result.fail(Errors.cardNotFound());
      }

      return Result.ok(card);
    } catch (error) {
      logger.error('Erro ao buscar card do usuário', { id, userId, error });
      return Result.fail(Errors.database('Erro ao buscar card'));
    }
  }

  /**
   * Cria um novo card
   */
  async create(
    userId: string,
    data: CreateCardDTO,
    photoFile?: UploadableFile | null,
    audioFile?: UploadableFile | null
  ): Promise<Result<CardEntity, AppError>> {
    try {
      // Upload da foto (paralelo se tiver ambos)
      const uploadPromises: Promise<Result<string, AppError>>[] = [];
      
      if (photoFile) {
        uploadPromises.push(this.storage.uploadImage(photoFile));
      }
      if (audioFile) {
        uploadPromises.push(this.storage.uploadAudio(audioFile));
      }

      const uploadResults = await Promise.all(uploadPromises);

      // Verifica erros nos uploads
      for (const result of uploadResults) {
        if (!result.success) {
          return Result.fail(result.error);
        }
      }

      // Extrai URLs
      let fotoUrl: string | null = null;
      let audioUrl: string | null = null;
      let idx = 0;
      
      if (photoFile && uploadResults[idx]) {
        fotoUrl = Result.unwrapOr(uploadResults[idx], '') || null;
        idx++;
      }
      if (audioFile && uploadResults[idx]) {
        audioUrl = Result.unwrapOr(uploadResults[idx], '') || null;
      }

      // Cria o card
      const card = await this.cardRepo.create({
        ...data,
        userId,
      });

      // Atualiza com as URLs se houver
      if (fotoUrl || audioUrl) {
        const updatedCard = await this.cardRepo.update(card.id, { fotoUrl, audioUrl });
        if (updatedCard) {
          logger.info('Card criado com sucesso', { cardId: card.id, userId });
          return Result.ok(updatedCard);
        }
      }

      logger.info('Card criado com sucesso', { cardId: card.id, userId });
      return Result.ok(card);
    } catch (error) {
      logger.error('Erro ao criar card', { userId, error });
      return Result.fail(Errors.database('Erro ao criar card'));
    }
  }

  /**
   * Atualiza um card existente
   */
  async update(
    id: string,
    userId: string,
    data: UpdateCardDTO,
    photoFile?: UploadableFile | null
  ): Promise<Result<CardEntity, AppError>> {
    try {
      // Verifica se o card existe e pertence ao usuário
      const existingCard = await this.cardRepo.findByIdAndUserId(id, userId);
      
      if (!existingCard) {
        return Result.fail(Errors.cardNotFound());
      }

      let fotoUrl = existingCard.fotoUrl;

      // Se há nova foto, faz upload e deleta a antiga
      if (photoFile) {
        // Upload da nova
        const uploadResult = await this.storage.uploadImage(photoFile);
        
        if (!uploadResult.success) {
          return Result.fail(uploadResult.error);
        }

        const newUrl = Result.unwrap(uploadResult);
        
        // Deleta a antiga (fire and forget)
        if (existingCard.fotoUrl) {
          this.storage.deleteFile(existingCard.fotoUrl).catch((err) => {
            logger.warn('Falha ao deletar foto antiga', { url: existingCard.fotoUrl, err });
          });
        }

        fotoUrl = newUrl || null;
      }

      const updatedCard = await this.cardRepo.update(id, {
        ...data,
        fotoUrl,
      });

      if (!updatedCard) {
        return Result.fail(Errors.cardNotFound());
      }

      logger.info('Card atualizado com sucesso', { cardId: id, userId });
      return Result.ok(updatedCard);
    } catch (error) {
      logger.error('Erro ao atualizar card', { id, userId, error });
      return Result.fail(Errors.database('Erro ao atualizar card'));
    }
  }

  /**
   * Deleta um card e seus arquivos associados
   */
  async delete(id: string, userId: string): Promise<Result<void, AppError>> {
    try {
      const card = await this.cardRepo.findByIdAndUserId(id, userId);
      
      if (!card) {
        return Result.fail(Errors.cardNotFound());
      }

      // Deleta arquivos em paralelo (fire and forget)
      const deletePromises: Promise<unknown>[] = [];
      
      if (card.fotoUrl) {
        deletePromises.push(
          this.storage.deleteFile(card.fotoUrl).catch((err) => {
            logger.warn('Falha ao deletar foto', { url: card.fotoUrl, err });
          })
        );
      }
      
      if (card.audioUrl) {
        deletePromises.push(
          this.storage.deleteFile(card.audioUrl).catch((err) => {
            logger.warn('Falha ao deletar áudio', { url: card.audioUrl, err });
          })
        );
      }

      // Não espera os deletes de arquivo (async cleanup)
      Promise.all(deletePromises);

      // Deleta o card
      await this.cardRepo.delete(id);

      logger.info('Card deletado com sucesso', { cardId: id, userId });
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Erro ao deletar card', { id, userId, error });
      return Result.fail(Errors.database('Erro ao deletar card'));
    }
  }

  /**
   * Conta quantos cards um usuário tem
   */
  async countByUser(userId: string): Promise<Result<number, AppError>> {
    try {
      const count = await this.cardRepo.countByUserId(userId);
      return Result.ok(count);
    } catch (error) {
      logger.error('Erro ao contar cards', { userId, error });
      return Result.fail(Errors.database('Erro ao contar cards'));
    }
  }
}

// Singleton para uso global
export const cardService = new CardService();
