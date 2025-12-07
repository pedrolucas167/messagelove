/**
 * Storage Service - S3 Implementation
 * Single Responsibility: upload/delete de arquivos
 * Open/Closed: pode ser estendido para outros providers
 */

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { env } from '../lib/env';
import { Result } from '../core/types/result';
import { Errors, AppError } from '../core/errors/app-error';
import type { IStorageService, UploadableFile } from '../core/interfaces/service';
import { logger } from '../config/logger';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 16 * 1024 * 1024; // 16MB

export class S3StorageService implements IStorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET || '';
    this.region = env.AWS_REGION || 'us-east-1';
    this.isConfigured = !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && this.bucket);

    this.client = this.isConfigured
      ? new S3Client({
          region: this.region,
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
          },
        })
      : null;
  }

  async uploadImage(file: UploadableFile): Promise<Result<string, AppError>> {
    if (!this.client || !this.isConfigured) {
      logger.warn('S3 não configurado, pulando upload de imagem');
      return Result.ok('');
    }

    // Validação do tipo
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return Result.fail(
        Errors.validation(
          'Tipo de arquivo não suportado. Utilize JPEG, PNG, WebP ou GIF.',
          { allowed: ALLOWED_IMAGE_TYPES }
        )
      );
    }

    // Validação do tamanho
    if (file.buffer.length > MAX_IMAGE_SIZE) {
      return Result.fail(
        Errors.validation('Imagem muito grande. Tamanho máximo: 10MB')
      );
    }

    try {
      // Otimização da imagem
      const optimizedBuffer = await this.optimizeImage(file.buffer, file.mimetype);
      const key = `cards/${nanoid(16)}.webp`;

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
          ACL: 'public-read',
          CacheControl: 'max-age=31536000', // 1 ano
        })
      );

      const url = this.buildUrl(key);
      logger.info('Imagem uploaded com sucesso', { key, size: optimizedBuffer.length });
      
      return Result.ok(url);
    } catch (error) {
      logger.error('Erro ao fazer upload da imagem', { error });
      return Result.fail(Errors.externalService('S3', 'Erro ao fazer upload da imagem'));
    }
  }

  async uploadAudio(file: UploadableFile): Promise<Result<string, AppError>> {
    if (!this.client || !this.isConfigured) {
      logger.warn('S3 não configurado, pulando upload de áudio');
      return Result.ok('');
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      return Result.fail(
        Errors.validation(
          'Tipo de áudio não suportado. Utilize WebM, MP4, MP3, OGG ou WAV.',
          { allowed: ALLOWED_AUDIO_TYPES }
        )
      );
    }

    if (file.buffer.length > MAX_AUDIO_SIZE) {
      return Result.fail(
        Errors.validation('Áudio muito grande. Tamanho máximo: 16MB')
      );
    }

    try {
      const ext = this.getAudioExtension(file.mimetype);
      const key = `cards/audio/${nanoid(16)}.${ext}`;

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
          CacheControl: 'max-age=31536000',
        })
      );

      const url = this.buildUrl(key);
      logger.info('Áudio uploaded com sucesso', { key, size: file.buffer.length });
      
      return Result.ok(url);
    } catch (error) {
      logger.error('Erro ao fazer upload do áudio', { error });
      return Result.fail(Errors.externalService('S3', 'Erro ao fazer upload do áudio'));
    }
  }

  async deleteFile(url: string): Promise<Result<void, AppError>> {
    if (!url || !this.client || !this.isConfigured) {
      return Result.ok(undefined);
    }

    const key = this.extractKeyFromUrl(url);
    if (!key) {
      return Result.ok(undefined);
    }

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      logger.info('Arquivo deletado com sucesso', { key });
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Erro ao deletar arquivo', { error, key });
      // Não falha a operação se não conseguir deletar
      return Result.ok(undefined);
    }
  }

  private async optimizeImage(buffer: Buffer, mimetype: string): Promise<Buffer> {
    const sharpInstance = sharp(buffer);

    // GIFs mantêm o formato (animated)
    if (mimetype === 'image/gif') {
      return sharpInstance
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }

    // Outros formatos viram WebP
    return sharpInstance
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  }

  private getAudioExtension(mimetype: string): string {
    const extensions: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
    };
    return extensions[mimetype] || 'webm';
  }

  private buildUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private extractKeyFromUrl(url: string): string | null {
    const match = url.match(/\.com\/(.+)$/);
    return match?.[1] ?? null;
  }
}

// Singleton
export const storageService = new S3StorageService();
