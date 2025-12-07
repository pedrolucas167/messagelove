/**
 * Card DTOs - Data Transfer Objects
 * Separação clara entre dados de entrada/saída da API
 */

import { z } from 'zod';

// Schemas de validação com Zod
export const CreateCardSchema = z.object({
  de: z
    .string()
    .min(1, 'Campo "de" é obrigatório')
    .max(120, 'Campo "de" deve ter no máximo 120 caracteres')
    .transform((v) => v.trim()),
  para: z
    .string()
    .min(1, 'Campo "para" é obrigatório')
    .max(120, 'Campo "para" deve ter no máximo 120 caracteres')
    .transform((v) => v.trim()),
  mensagem: z
    .string()
    .min(1, 'Mensagem é obrigatória')
    .max(5000, 'Mensagem muito longa')
    .transform((v) => v.trim()),
  youtubeVideoId: z
    .string()
    .max(32)
    .nullable()
    .optional()
    .transform((v) => v || null),
  youtubeStartTime: z
    .number()
    .int()
    .min(0)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  youtubeEndTime: z
    .number()
    .int()
    .min(0)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  youtubeAutoplay: z.boolean().optional().default(false),
  spotifyUri: z
    .string()
    .max(100)
    .nullable()
    .optional()
    .transform((v) => v || null),
  musicType: z
    .enum(['youtube', 'spotify'])
    .nullable()
    .optional()
    .transform((v) => v || null),
  audioDuration: z
    .number()
    .int()
    .min(0)
    .max(300)
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  relationshipDate: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  selectedAnimal: z
    .string()
    .max(20)
    .nullable()
    .optional()
    .transform((v) => v || null),
  selectedGif: z
    .string()
    .url()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => v || null),
  selectedEmoji: z
    .string()
    .max(10)
    .nullable()
    .optional()
    .transform((v) => v || null),
});

export const UpdateCardSchema = CreateCardSchema.partial();

export const CardIdSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Tipos inferidos dos schemas
export type CreateCardDTO = z.infer<typeof CreateCardSchema>;
export type UpdateCardDTO = z.infer<typeof UpdateCardSchema>;

// DTO de resposta
export interface CardResponseDTO {
  id: string;
  recipientName: string;
  senderName: string;
  message: string;
  photoUrl: string | null;
  youtubeVideoId: string | null;
  youtubeStartTime: number | null;
  youtubeEndTime: number | null;
  youtubeAutoplay: boolean;
  spotifyUri: string | null;
  musicType: 'youtube' | 'spotify' | null;
  audioUrl: string | null;
  audioDuration: number | null;
  relationshipDate: string | null;
  selectedAnimal: string | null;
  selectedGif: string | null;
  selectedEmoji: string | null;
  createdAt: string;
  updatedAt: string;
}

// Mapeador Model -> DTO (usa snake_case do DB -> camelCase da API)
export function toCardResponseDTO(card: CardModel): CardResponseDTO {
  return {
    id: card.id,
    recipientName: card.para,
    senderName: card.de,
    message: card.mensagem,
    photoUrl: card.fotoUrl,
    youtubeVideoId: card.youtubeVideoId,
    youtubeStartTime: card.youtubeStartTime,
    youtubeEndTime: card.youtubeEndTime,
    youtubeAutoplay: card.youtubeAutoplay ?? false,
    spotifyUri: card.spotifyUri,
    musicType: card.musicType,
    audioUrl: card.audioUrl,
    audioDuration: card.audioDuration,
    relationshipDate: card.relationshipDate?.toISOString() ?? null,
    selectedAnimal: card.selectedAnimal,
    selectedGif: card.selectedGif,
    selectedEmoji: card.selectedEmoji,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

// Interface do model (para tipagem do mapeador)
interface CardModel {
  id: string;
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
